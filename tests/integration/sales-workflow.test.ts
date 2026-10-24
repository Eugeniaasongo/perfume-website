import { after, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/orders/checkout";
import { transitionOrderState, COD_NO_SHOW_LIMIT } from "@/lib/orders/state-machine";
import { recordCodCashCollection } from "@/lib/cod";
import { refundOrder, RefundError } from "@/lib/orders/refunds";
import { confirmPaystackPayment, recordPaystackCharge } from "@/lib/payments/paystack";
import { notifyBackInStock, notifyOrderStatus } from "@/lib/notifications/orders";
import { exportOrdersCsv, getSalesReport } from "@/lib/reports";
import { baseCheckout, cleanupTestData, createTestProduct, testPhone } from "../helpers";

// No Paystack key: the provider runs in mock mode, so refunds never hit the real API.
delete process.env.PAYSTACK_SECRET_KEY;
process.env.ADMIN_ALERT_PHONE = "+233200000001";

after(async () => {
  await prisma.notificationLog.deleteMany({ where: { recipient: process.env.ADMIN_ALERT_PHONE } });
  await cleanupTestData();
  await prisma.$disconnect();
});

const variantStock = async (id: string) => (await prisma.productVariant.findUniqueOrThrow({ where: { id } })).stock;

async function codOrder(quantity = 1, stock = 10, phone = testPhone()) {
  const product = await createTestProduct(stock);
  const order = await createOrder({
    ...baseCheckout,
    customerPhone: phone,
    paymentProvider: "CASH_ON_DELIVERY",
    items: [{ variantId: product.variants[0].id, quantity }],
    isCodOtpVerified: true,
  });
  return { order, variantId: product.variants[0].id };
}

async function paidOnlineOrder(quantity = 1, stock = 10) {
  const product = await createTestProduct(stock);
  const order = await createOrder({
    ...baseCheckout,
    customerPhone: testPhone(),
    customerEmail: "test@example.com",
    paymentProvider: "PAYSTACK",
    items: [{ variantId: product.variants[0].id, quantity }],
    isCodOtpVerified: false,
  });
  await confirmPaystackPayment(order.id, `RYZ-PAY-${order.orderNumber}-${Date.now()}`);
  return { order: await prisma.order.findUniqueOrThrow({ where: { id: order.id } }), variantId: product.variants[0].id };
}

test("orders keep a customer record", async () => {
  const phone = testPhone();
  await codOrder(1, 10, phone);
  await codOrder(1, 10, phone);
  const customer = await prisma.customer.findUniqueOrThrow({ where: { phone } });
  assert.equal(customer.orderCount, 2);
  assert.equal(customer.name, baseCheckout.customerName);
});

test("customers and the shop are texted when a COD order is placed", async () => {
  const { order } = await codOrder();
  await notifyOrderStatus(order.id, "ORDER_PLACED");

  const logs = await prisma.notificationLog.findMany({ where: { orderId: order.id } });
  const customerSms = logs.find((l) => l.template === "ORDER_PLACED");
  assert.equal(customerSms?.status, "SENT");
  assert.equal(customerSms?.recipient, order.customerPhone);
  assert.match(customerSms!.message, new RegExp(order.orderNumber));
  assert.ok(logs.some((l) => l.template === "ADMIN_NEW_ORDER" && l.recipient === process.env.ADMIN_ALERT_PHONE));
});

test("dispatch requires a rider and tells the customer who is coming", async () => {
  const { order } = await codOrder();
  await transitionOrderState({ orderId: order.id, targetState: "CONFIRMED", actor: "TEST" });
  await transitionOrderState({ orderId: order.id, targetState: "PROCESSING", actor: "TEST" });

  await assert.rejects(
    transitionOrderState({ orderId: order.id, targetState: "SHIPPED", actor: "TEST" }),
    /rider/
  );

  await transitionOrderState({
    orderId: order.id,
    targetState: "SHIPPED",
    actor: "TEST",
    details: { riderName: "Kwame", riderPhone: "+233241112222" },
  });
  const shipped = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(shipped.riderName, "Kwame");
  assert.ok(shipped.shippedAt && shipped.confirmedAt);

  const sms = await prisma.notificationLog.findFirstOrThrow({ where: { orderId: order.id, template: "SHIPPED" } });
  assert.match(sms.message, /Kwame/);
  assert.match(sms.message, /ready in cash or MoMo/);
});

test(`COD is blocked after ${COD_NO_SHOW_LIMIT} refused deliveries`, async () => {
  const phone = testPhone();
  for (let i = 0; i < COD_NO_SHOW_LIMIT; i++) {
    const { order } = await codOrder(1, 10, phone);
    await transitionOrderState({ orderId: order.id, targetState: "CONFIRMED", actor: "TEST" });
    await transitionOrderState({ orderId: order.id, targetState: "PROCESSING", actor: "TEST" });
    await transitionOrderState({
      orderId: order.id,
      targetState: "SHIPPED",
      actor: "TEST",
      details: { riderName: "Kwame" },
    });
    await transitionOrderState({ orderId: order.id, targetState: "RETURNED_REFUSED", actor: "TEST" });
  }
  const customer = await prisma.customer.findUniqueOrThrow({ where: { phone } });
  assert.equal(customer.noShowCount, COD_NO_SHOW_LIMIT);
  assert.ok(customer.isBlacklisted);
});

test("returning from Paystack marks the order paid, and a racing webhook doesn't double-count", async () => {
  const product = await createTestProduct(5);
  const order = await createOrder({
    ...baseCheckout,
    customerPhone: testPhone(),
    customerEmail: "test@example.com",
    paymentProvider: "PAYSTACK",
    items: [{ variantId: product.variants[0].id, quantity: 1 }],
    isCodOtpVerified: false,
  });
  const reference = `RYZ-PAY-${order.orderNumber}-1`;

  const results = await Promise.all([
    recordPaystackCharge({ reference, amountPesewas: order.totalPrice, orderId: order.id, source: "PAYSTACK_WEBHOOK" }),
    recordPaystackCharge({ reference, amountPesewas: order.totalPrice, orderId: order.id, source: "PAYSTACK_VERIFY" }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), ["already_processed", "success"]);

  const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(paid.status, "PAID");
  assert.ok(paid.paidAt);
  assert.equal(await prisma.paymentLedger.count({ where: { orderId: order.id } }), 1);
  assert.equal(await prisma.notificationLog.count({ where: { orderId: order.id, template: "PAID" } }), 1);
});

test("a foreign payment reference can't mark an order paid", async () => {
  const product = await createTestProduct(5);
  const order = await createOrder({
    ...baseCheckout,
    customerPhone: testPhone(),
    customerEmail: "test@example.com",
    paymentProvider: "PAYSTACK",
    items: [{ variantId: product.variants[0].id, quantity: 1 }],
    isCodOtpVerified: false,
  });
  await confirmPaystackPayment(order.id, "RYZ-PAY-RYZ-OTHER-123");
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "PENDING_PAYMENT");
});

test("partial then full Paystack refunds track the amount and status", async () => {
  const { order } = await paidOnlineOrder();
  assert.equal(order.status, "PAID");

  await assert.rejects(
    refundOrder({ orderId: order.id, amountPesewas: order.totalPrice + 1, reason: "too much", actor: "TEST" }),
    RefundError
  );

  await refundOrder({ orderId: order.id, amountPesewas: 1000, reason: "Gift wrap missing", actor: "TEST" });
  let updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(updated.status, "PARTIALLY_REFUNDED");
  assert.equal(updated.refundedAmount, 1000);

  await refundOrder({ orderId: order.id, amountPesewas: order.totalPrice - 1000, reason: "Cancelled", actor: "TEST" });
  updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(updated.status, "REFUNDED");
  assert.equal(updated.refundedAmount, order.totalPrice);
  assert.equal(await prisma.paymentLedger.count({ where: { orderId: order.id, status: "REFUNDED" } }), 2);

  await assert.rejects(
    refundOrder({ orderId: order.id, amountPesewas: 100, reason: "again", actor: "TEST" }),
    RefundError
  );
});

test("a full refund before dispatch puts the bottles back in stock", async () => {
  const { order, variantId } = await paidOnlineOrder(2, 5);
  assert.equal(await variantStock(variantId), 3);
  await refundOrder({ orderId: order.id, amountPesewas: order.totalPrice, reason: "Customer cancelled", actor: "TEST" });
  assert.equal(await variantStock(variantId), 5);
});

test("COD refunds are only possible after cash has been collected", async () => {
  const { order } = await codOrder();
  await assert.rejects(
    refundOrder({ orderId: order.id, amountPesewas: 100, reason: "nothing paid", actor: "TEST" }),
    /nothing to refund/
  );

  await recordCodCashCollection({ orderId: order.id, collectedAmountPesewas: order.totalPrice, collectorName: "Kwame" });
  await refundOrder({ orderId: order.id, amountPesewas: 2000, reason: "Damaged box", actor: "TEST" });

  const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(updated.status, "PARTIALLY_REFUNDED");
  const ledger = await prisma.paymentLedger.findFirstOrThrow({ where: { orderId: order.id } });
  assert.equal(ledger.provider, "COD_MANUAL");
});

test("waiting customers are texted once when a sold-out size is restocked", async () => {
  const product = await createTestProduct(0);
  const variantId = product.variants[0].id;
  const phone = testPhone();
  await prisma.backInStockSubscriber.create({ data: { variantId, phone } });

  assert.equal(await notifyBackInStock(variantId), 0, "nothing sent while still sold out");

  await prisma.productVariant.update({ where: { id: variantId }, data: { stock: 4 } });
  assert.equal(await notifyBackInStock(variantId), 1);
  assert.equal(await notifyBackInStock(variantId), 0, "not texted twice");

  const sms = await prisma.notificationLog.findFirstOrThrow({ where: { recipient: phone, template: "BACK_IN_STOCK" } });
  assert.match(sms.message, /back in stock/);
});

test("reports count real sales and the CSV export is spreadsheet-safe", async () => {
  const before = await getSalesReport(7);
  const { order } = await codOrder();
  await prisma.order.update({ where: { id: order.id }, data: { customerName: "=HYPERLINK(\"x\")" } });

  const after = await getSalesReport(7);
  assert.equal(after.orderCount, before.orderCount + 1);
  assert.equal(after.grossSalesPesewas, before.grossSalesPesewas + order.totalPrice);
  assert.equal(after.daily.length, 7);

  const csv = await exportOrdersCsv(new Date(Date.now() - 60_000));
  const row = csv.split("\r\n").find((line) => line.includes(order.orderNumber));
  assert.ok(row);
  assert.ok(row!.includes(`"'=HYPERLINK(""x"")"`), "formula is neutralised");
});
