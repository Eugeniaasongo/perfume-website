import crypto from "crypto";
import { processPaystackWebhookEvent } from "../../src/lib/payments/paystack";
import { prisma } from "../../src/lib/prisma";

async function testPaystackWebhook() {
  console.log("Testing Paystack Webhook Integration & Idempotency...");

  const secretKey = "sk_test_mock_paystack_secret_key";
  process.env.PAYSTACK_SECRET_KEY = secretKey;

  const order = await prisma.order.create({
    data: {
      orderNumber: `TEST-ORD-${Date.now()}`,
      status: "PENDING_PAYMENT",
      paymentProvider: "PAYSTACK",
      customerName: "Kofi Mensah",
      customerEmail: "kofi@example.com",
      customerPhone: "+233201234567",
      region: "Accra",
      city: "East Legon",
      addressLine: "12 Palm Street",
      itemsPrice: 29900,
      shippingPrice: 2000,
      discountPrice: 0,
      totalPrice: 31900,
    },
  });

  const payload = {
    event: "charge.success",
    data: {
      reference: `PAY-REF-${Date.now()}`,
      amount: 31900,
      metadata: {
        orderId: order.id,
      },
    },
  };

  const rawBody = JSON.stringify(payload);
  const validSignature = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  try {
    await processPaystackWebhookEvent(rawBody, "invalid_signature");
    throw new Error("Failed: Invalid signature was accepted!");
  } catch (e: any) {
    if (!e.message.includes("Invalid Paystack HMAC signature")) throw e;
    console.log("Passed 1: Invalid signature correctly rejected.");
  }

  const result1 = await processPaystackWebhookEvent(rawBody, validSignature);
  if (result1.status !== "success") {
    throw new Error(`Failed: Webhook expected success, got ${result1.status}`);
  }

  const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
  if (updatedOrder?.status !== "PAID") {
    throw new Error(`Failed: Order status expected PAID, got ${updatedOrder?.status}`);
  }
  console.log("Passed 2: Valid webhook processed and order marked PAID.");

  const result2 = await processPaystackWebhookEvent(rawBody, validSignature);
  if (result2.status !== "already_processed") {
    throw new Error(`Failed: Duplicate webhook expected already_processed, got ${result2.status}`);
  }
  console.log("Passed 3: Duplicate webhook safely handled via idempotency check.");

  console.log("ALL PAYSTACK WEBHOOK TESTS PASSED!");
}

testPaystackWebhook().catch((e) => {
  console.error("Paystack webhook test failed:", e);
  process.exit(1);
});
