import { after, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { sendPhoneOtp, verifyPhoneOtp, OtpError, OTP_MAX_ATTEMPTS } from "@/lib/otp";
import { recordCodCashCollection } from "@/lib/cod";
import { createOrder } from "@/lib/orders/checkout";
import { baseCheckout, createTestProduct, testPhone, cleanupTestData } from "../helpers";

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test("OTP verifies once and is then consumed", async () => {
  const phone = testPhone();
  const { devCode } = await sendPhoneOtp(phone);
  assert.ok(devCode, "dev code is exposed only outside production without SMS");

  assert.equal(await verifyPhoneOtp(phone, "000000"), false);
  assert.equal(await verifyPhoneOtp(phone, devCode!), true);
  assert.equal(await verifyPhoneOtp(phone, devCode!), false, "codes are single use");
});

test("OTP is locked after too many wrong attempts", async () => {
  const phone = testPhone();
  const { devCode } = await sendPhoneOtp(phone);
  for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
    assert.equal(await verifyPhoneOtp(phone, "000000"), false);
  }
  assert.equal(await verifyPhoneOtp(phone, devCode!), false);
});

test("OTP resend is rate limited", async () => {
  const phone = testPhone();
  await sendPhoneOtp(phone);
  await assert.rejects(sendPhoneOtp(phone), (e) => e instanceof OtpError && e.status === 429);
});

test("COD cash collection reconciles or flags discrepancies", async () => {
  const product = await createTestProduct(5);
  const make = () =>
    createOrder({
      ...baseCheckout,
      customerPhone: testPhone(),
      paymentProvider: "CASH_ON_DELIVERY",
      items: [{ variantId: product.variants[0].id, quantity: 1 }],
      isCodOtpVerified: true,
    });

  const exact = await make();
  const log = await recordCodCashCollection({
    orderId: exact.id,
    collectedAmountPesewas: exact.totalPrice,
    collectorName: "Kwame Rider",
  });
  assert.ok(log.isReconciled);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: exact.id } })).status, "DELIVERED");

  const short = await make();
  const shortLog = await recordCodCashCollection({
    orderId: short.id,
    collectedAmountPesewas: short.totalPrice - 500,
    collectorName: "Kwame Rider",
  });
  assert.ok(!shortLog.isReconciled);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: short.id } })).status, "ON_HOLD");
});
