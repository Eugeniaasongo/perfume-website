import { after, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { processPaystackWebhookEvent, WebhookSignatureError } from "@/lib/payments/paystack";
import { createOrder } from "@/lib/orders/checkout";
import { baseCheckout, createTestProduct, testPhone, uniqueSuffix, cleanupTestData } from "../helpers";

const SECRET = "sk_test_webhook_secret";
process.env.PAYSTACK_SECRET_KEY = SECRET;

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

function sign(body: string) {
  return crypto.createHmac("sha512", SECRET).update(body).digest("hex");
}

async function pendingOrder() {
  const product = await createTestProduct(5);
  return createOrder({
    ...baseCheckout,
    customerPhone: testPhone(),
    customerEmail: "kofi@example.com",
    paymentProvider: "PAYSTACK",
    items: [{ variantId: product.variants[0].id, quantity: 1 }],
    isCodOtpVerified: false,
  });
}

function chargeEvent(orderId: string, amount: number) {
  return JSON.stringify({
    event: "charge.success",
    data: { reference: `REF-${uniqueSuffix()}`, amount, currency: "GHS", metadata: { orderId } },
  });
}

test("rejects invalid signatures", async () => {
  const body = chargeEvent("x", 100);
  await assert.rejects(processPaystackWebhookEvent(body, "deadbeef"), WebhookSignatureError);
});

test("marks the order paid exactly once", async () => {
  const order = await pendingOrder();
  const body = chargeEvent(order.id, order.totalPrice);

  const first = await processPaystackWebhookEvent(body, sign(body));
  assert.equal(first.status, "success");
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "PAID");

  const replay = await processPaystackWebhookEvent(body, sign(body));
  assert.equal(replay.status, "already_processed");
  assert.equal(await prisma.paymentLedger.count({ where: { orderId: order.id } }), 1);
});

test("holds orders when the paid amount doesn't match", async () => {
  const order = await pendingOrder();
  const body = chargeEvent(order.id, order.totalPrice - 100);

  const result = await processPaystackWebhookEvent(body, sign(body));
  assert.equal(result.status, "needs_review");
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "ON_HOLD");
});

test("ignores non-charge events", async () => {
  const body = JSON.stringify({ event: "transfer.success", data: {} });
  const result = await processPaystackWebhookEvent(body, sign(body));
  assert.equal(result.status, "ignored");
});
