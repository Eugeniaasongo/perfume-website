import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { isProduction } from "@/lib/env";
import { canTransition, transitionOrderStateTx, type OrderState } from "@/lib/orders/state-machine";

export interface PaymentInitializationInput {
  orderId: string;
  orderNumber: string;
  amountPesewas: number;
  email: string;
  callbackUrl: string;
}

export interface PaymentProvider {
  initializeTransaction(
    input: PaymentInitializationInput
  ): Promise<{ authorizationUrl: string; reference: string }>;
  verifyTransaction(reference: string): Promise<{ success: boolean; amountPesewas: number }>;
}

const MOCK_SECRET = "sk_test_mock_paystack_secret_key";

export class PaystackProvider implements PaymentProvider {
  private secretKey: string;
  private isMock: boolean;

  constructor() {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key && isProduction) {
      throw new Error("PAYSTACK_SECRET_KEY must be set in production");
    }
    this.secretKey = key || MOCK_SECRET;
    this.isMock = this.secretKey === MOCK_SECRET;
  }

  async initializeTransaction(input: PaymentInitializationInput) {
    const reference = `RYZ-PAY-${input.orderNumber}-${Date.now()}`;

    if (this.isMock) {
      // Local development without Paystack keys: skip the gateway and land on the order page.
      return { authorizationUrl: `${input.callbackUrl}&reference=${reference}`, reference };
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amountPesewas,
        currency: "GHS",
        reference,
        callback_url: input.callbackUrl,
        metadata: {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      throw new Error(data.message || "Failed to initialize Paystack payment");
    }

    return {
      authorizationUrl: data.data.authorization_url,
      reference,
    };
  }

  async verifyTransaction(reference: string) {
    if (this.isMock) {
      return { success: false, amountPesewas: 0 };
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${this.secretKey}` },
        signal: AbortSignal.timeout(15_000),
      }
    );

    const data = await response.json();
    if (!data.status || data.data.status !== "success") {
      return { success: false, amountPesewas: 0 };
    }

    return {
      success: true,
      amountPesewas: data.data.amount,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const expected = Buffer.from(
      crypto.createHmac("sha512", this.secretKey).update(rawBody).digest("hex"),
      "hex"
    );
    const actual = Buffer.from(signature, "hex");
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }
}

export class WebhookSignatureError extends Error {}

export async function processPaystackWebhookEvent(rawBody: string, signature: string) {
  const paystack = new PaystackProvider();

  if (!paystack.verifyWebhookSignature(rawBody, signature)) {
    throw new WebhookSignatureError("Invalid Paystack HMAC signature");
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "charge.success") {
    return { status: "ignored", event: event.event };
  }

  const { reference, amount, currency, metadata } = event.data;
  const orderId = metadata?.orderId;

  if (!orderId) {
    return { status: "ignored", reason: "missing_order_id" };
  }

  const existingLedger = await prisma.paymentLedger.findUnique({
    where: { reference },
  });

  if (existingLedger) {
    return { status: "already_processed", reference };
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return { status: "ignored", reason: "order_not_found", orderId };
    }

    const amountMatches = order.totalPrice === amount && (currency ?? "GHS") === "GHS";

    await tx.paymentLedger.create({
      data: {
        orderId: order.id,
        provider: "PAYSTACK",
        reference,
        amountPesewas: amount,
        currency: currency ?? "GHS",
        status: amountMatches ? "SUCCESS" : "AMOUNT_MISMATCH",
        hmacSignature: signature,
        metadataJson: JSON.stringify(metadata),
      },
    });

    const current = order.status as OrderState;
    // Money arrived for an order we can't simply mark paid (e.g. it was already cancelled
    // and its stock released): park it for manual review instead of dropping the payment.
    const target: OrderState = amountMatches && canTransition(current, "PAID") ? "PAID" : "ON_HOLD";

    if (current !== target && canTransition(current, target)) {
      await transitionOrderStateTx(tx, {
        orderId: order.id,
        targetState: target,
        actor: "PAYSTACK_WEBHOOK",
        notes: amountMatches
          ? `Payment ${reference} confirmed`
          : `Amount mismatch: expected ${order.totalPrice}, received ${amount} ${currency ?? ""}`,
      });
    } else if (target === "ON_HOLD") {
      await tx.auditLog.create({
        data: {
          orderId: order.id,
          actor: "PAYSTACK_WEBHOOK",
          action: "PAYMENT_NEEDS_REVIEW",
          details: `Payment ${reference} received while order was ${current}`,
        },
      });
    }

    return { status: target === "PAID" ? "success" : "needs_review", orderId, reference };
  });
}
