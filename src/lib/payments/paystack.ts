import crypto from "crypto";
import { prisma } from "@/lib/prisma";

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

export class PaystackProvider implements PaymentProvider {
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || "sk_test_mock_paystack_secret_key";
  }

  async initializeTransaction(input: PaymentInitializationInput) {
    const reference = `RYZ-PAY-${input.orderNumber}-${Date.now()}`;

    if (process.env.NODE_ENV === "test" || this.secretKey.includes("mock")) {
      return {
        authorizationUrl: `https://checkout.paystack.com/sandbox_mock_${reference}`,
        reference,
      };
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
        reference,
        callback_url: input.callbackUrl,
        metadata: {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
        },
      }),
    });

    const data = await response.json();
    if (!data.status) {
      throw new Error(data.message || "Failed to initialize Paystack payment");
    }

    return {
      authorizationUrl: data.data.authorization_url,
      reference,
    };
  }

  async verifyTransaction(reference: string) {
    if (process.env.NODE_ENV === "test" || this.secretKey.includes("mock")) {
      return { success: true, amountPesewas: 29900 };
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
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
    const hash = crypto
      .createHmac("sha512", this.secretKey)
      .update(rawBody)
      .digest("hex");
    return hash === signature;
  }
}

export async function processPaystackWebhookEvent(rawBody: string, signature: string) {
  const paystack = new PaystackProvider();

  if (!paystack.verifyWebhookSignature(rawBody, signature)) {
    throw new Error("Invalid Paystack HMAC signature");
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "charge.success") {
    return { status: "ignored", event: event.event };
  }

  const { reference, amount, metadata } = event.data;
  const orderId = metadata?.orderId;

  if (!orderId) {
    throw new Error("Missing orderId in payment metadata");
  }

  const existingLedger = await prisma.paymentLedger.findUnique({
    where: { reference },
  });

  if (existingLedger) {
    return { status: "already_processed", reference };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (order.totalPrice !== amount) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "ON_HOLD" },
    });
    throw new Error(
      `Amount mismatch: order requires ${order.totalPrice} pesewas, received ${amount}`
    );
  }

  await prisma.$transaction([
    prisma.paymentLedger.create({
      data: {
        orderId: order.id,
        provider: "PAYSTACK",
        reference,
        amountPesewas: amount,
        status: "SUCCESS",
        hmacSignature: signature,
        metadataJson: JSON.stringify(metadata),
      },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    }),
  ]);

  return { status: "success", orderId, reference };
}
