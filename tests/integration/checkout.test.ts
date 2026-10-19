import { after, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { createOrder, quoteCart, CheckoutError } from "@/lib/orders/checkout";
import { transitionOrderState, expireStalePendingOrders } from "@/lib/orders/state-machine";
import { validateAndApplyDiscount } from "@/lib/pricing";
import { baseCheckout, createTestProduct, testPhone, uniqueSuffix, cleanupTestData } from "../helpers";

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test("quote prices from the database, not the client", async () => {
  const product = await createTestProduct(10, 30000);
  const quote = await quoteCart({
    region: "Ashanti",
    items: [
      { variantId: product.variants[0].id, quantity: 1 },
      { variantId: product.variants[0].id, quantity: 1 },
    ],
  });
  assert.equal(quote.lines.length, 1, "duplicate lines are merged");
  assert.equal(quote.itemsPricePesewas, 60000);
  assert.equal(quote.shippingPricePesewas, 0);
  assert.equal(quote.totalPricePesewas, 60000);
});

test("discount codes apply and are redeemed once per order", async () => {
  const code = `T${uniqueSuffix()}`.toUpperCase();
  await prisma.discountCode.create({ data: { code, percentageOff: 10, maxUses: 1 } });

  const preview = await validateAndApplyDiscount({ code, itemsPricePesewas: 30000 });
  assert.ok(preview.valid);
  assert.equal(preview.discountPesewas, 3000);

  const product = await createTestProduct(10, 30000);
  const order = await createOrder({
    ...baseCheckout,
    customerPhone: testPhone(),
    paymentProvider: "CASH_ON_DELIVERY",
    discountCode: code,
    items: [{ variantId: product.variants[0].id, quantity: 1 }],
    isCodOtpVerified: true,
  });
  assert.equal(order.discountPrice, 3000);
  assert.equal(order.totalPrice, 30000 + 3000 - 3000);

  const exhausted = await validateAndApplyDiscount({ code, itemsPricePesewas: 30000 });
  assert.ok(!exhausted.valid, "max uses enforced");
});

test("concurrent checkouts never oversell stock", async () => {
  const product = await createTestProduct(5);
  const variantId = product.variants[0].id;

  const results = await Promise.allSettled(
    Array.from({ length: 12 }, () =>
      createOrder({
        ...baseCheckout,
        customerPhone: testPhone(),
        paymentProvider: "CASH_ON_DELIVERY",
        items: [{ variantId, quantity: 1 }],
        isCodOtpVerified: true,
      })
    )
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const rejected = results.filter((r) => r.status === "rejected");
  assert.equal(succeeded, 5);
  for (const r of rejected) assert.ok((r as PromiseRejectedResult).reason instanceof CheckoutError);

  const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  assert.equal(variant.stock, 0);
});

test("cancelling an order returns its stock exactly once", async () => {
  const product = await createTestProduct(3);
  const variantId = product.variants[0].id;
  const order = await createOrder({
    ...baseCheckout,
    customerPhone: testPhone(),
    paymentProvider: "CASH_ON_DELIVERY",
    items: [{ variantId, quantity: 2 }],
    isCodOtpVerified: true,
  });
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock, 1);

  await transitionOrderState({ orderId: order.id, targetState: "CANCELLED", actor: "TEST" });
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock, 3);

  await assert.rejects(transitionOrderState({ orderId: order.id, targetState: "PAID", actor: "TEST" }));
  const logs = await prisma.auditLog.count({ where: { orderId: order.id } });
  assert.equal(logs, 2, "creation + cancellation logged");
});

test("stale unpaid online orders expire and release stock", async () => {
  const product = await createTestProduct(2);
  const variantId = product.variants[0].id;
  const order = await createOrder({
    ...baseCheckout,
    customerPhone: testPhone(),
    customerEmail: "test@example.com",
    paymentProvider: "PAYSTACK",
    items: [{ variantId, quantity: 2 }],
    isCodOtpVerified: false,
  });
  await prisma.order.update({ where: { id: order.id }, data: { createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) } });

  await expireStalePendingOrders();

  const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(updated.status, "CANCELLED");
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock, 2);
});
