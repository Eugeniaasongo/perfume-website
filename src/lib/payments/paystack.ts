import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyOrderStatus } from "@/lib/notifications/orders";
import { isProduction } from "@/lib/env";
import { canTransition, transitionOrderStateTx, type OrderState } from "@/lib/orders/state-machine";

export interface PaymentInitializationInput {
  orderId: string;
  orderNumber: string;
  amountPesewas: number;
  email: string;
  callbackUrl: string;
}

export interface VerifiedTransaction {
  success: boolean;
  reference: string;
  amountPesewas: number;
  currency: string;
  orderId?: string;
}

export interface PaymentProvider {
  initializeTransaction(
    input: PaymentInitializationInput
  ): Promise<{ authorizationUrl: string; reference: string }>;
  verifyTransaction(reference: string): Promise<VerifiedTransaction>;
  refundTransaction(reference: string, amountPesewas: number): Promise<{ refundId: string }>;
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

  get isMockMode() {
    return this.isMock;
  }

  async verifyTransaction(reference: string): Promise<VerifiedTransaction> {
    const failed = { success: false, reference, amountPesewas: 0, currency: "GHS" };
    if (this.isMock) return failed;

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${this.secretKey}` },
        signal: AbortSignal.timeout(15_000),
      }
    );

    const data = await response.json();
    if (!data.status || data.data?.status !== "success") return failed;

    return {
      success: true,
      reference,
      amountPesewas: data.data.amount,
      currency: data.data.currency ?? "GHS",
      orderId: data.data.metadata?.orderId,
    };
  }

  async refundTransaction(reference: string, amountPesewas: number): Promise<{ refundId: string }> {
    if (this.isMock) {
      return { refundId: `mock-refund-${Date.now()}` };
    }

    const response = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ transaction: reference, amount: amountPesewas }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      throw new Error(data.message || "Paystack refused the refund");
    }
    return { refundId: String(data.data?.id ?? data.data?.transaction?.id ?? Date.now()) };
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

/**
 * Records a successful Paystack charge against its order exactly once (the ledger's unique
 * reference makes this idempotent), then notifies the customer. Shared by the webhook and
 * by the verification that runs when the customer returns from Paystack.
 */
export async function recordPaystackCharge(charge: {
  reference: string;
  amountPesewas: number;
  currency?: string;
  orderId: string;
  signature?: string;
  metadata?: unknown;
  source: "PAYSTACK_WEBHOOK" | "PAYSTACK_VERIFY";
}) {
  const existingLedger = await prisma.paymentLedger.findUnique({
    where: { reference: charge.reference },
  });

  if (existingLedger) {
    return { status: "already_processed" as const, reference: charge.reference };
  }

  const currency = charge.currency ?? "GHS";

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: charge.orderId } });

      if (!order) {
        return { status: "ignored" as const, reason: "order_not_found", orderId: charge.orderId };
      }

      const amountMatches = order.totalPrice === charge.amountPesewas && currency === "GHS";

      await tx.paymentLedger.create({
        data: {
          orderId: order.id,
          provider: "PAYSTACK",
          reference: charge.reference,
          amountPesewas: charge.amountPesewas,
          currency,
          status: amountMatches ? "SUCCESS" : "AMOUNT_MISMATCH",
          hmacSignature: charge.signature,
          metadataJson: charge.metadata ? JSON.stringify(charge.metadata) : null,
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
          actor: charge.source,
          notes: amountMatches
            ? `Payment ${charge.reference} confirmed`
            : `Amount mismatch: expected ${order.totalPrice}, received ${charge.amountPesewas} ${currency}`,
        });
      } else if (target === "ON_HOLD") {
        await tx.auditLog.create({
          data: {
            orderId: order.id,
            actor: charge.source,
            action: "PAYMENT_NEEDS_REVIEW",
            details: `Payment ${charge.reference} received while order was ${current}`,
          },
        });
      }

      return {
        status: target === "PAID" ? ("success" as const) : ("needs_review" as const),
        orderId: order.id,
        reference: charge.reference,
        notify: current !== target && target === "PAID",
      };
    });
  } catch (error) {
    // The webhook and the return-from-Paystack check can race; the loser hits the unique reference.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "already_processed" as const, reference: charge.reference };
    }
    throw error;
  }

  if ("notify" in result && result.notify) {
    await notifyOrderStatus(result.orderId, "PAID");
  }
  return result;
}

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

  return recordPaystackCharge({
    reference,
    amountPesewas: amount,
    currency,
    orderId,
    signature,
    metadata,
    source: "PAYSTACK_WEBHOOK",
  });
}

/**
 * Confirms a payment directly with Paystack when the customer lands back on the order page,
 * so the order shows as paid even if the webhook is slow or lost.
 */
export async function confirmPaystackPayment(orderId: string, reference: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentProvider !== "PAYSTACK" || order.status !== "PENDING_PAYMENT") return;
  if (!reference.startsWith(`RYZ-PAY-${order.orderNumber}-`)) return;

  const paystack = new PaystackProvider();
  if (paystack.isMockMode) {
    // Local development without Paystack keys: treat the simulated checkout as paid.
    await recordPaystackCharge({ reference, amountPesewas: order.totalPrice, orderId, source: "PAYSTACK_VERIFY" });
    return;
  }

  const verified = await paystack.verifyTransaction(reference);
  if (!verified.success || (verified.orderId && verified.orderId !== orderId)) return;

  await recordPaystackCharge({
    reference,
    amountPesewas: verified.amountPesewas,
    currency: verified.currency,
    orderId,
    source: "PAYSTACK_VERIFY",
  });
}
