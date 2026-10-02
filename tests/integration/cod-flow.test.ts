import { sendPhoneOtp, verifyPhoneOtp, recordCodCashCollection } from "../../src/lib/cod";
import { prisma } from "../../src/lib/prisma";

async function testCodFlow() {
  console.log("Testing COD Flow: Phone OTP & Cash Reconciliation Ledger...");

  const phone = "+233240001122";

  const { otp } = await sendPhoneOtp(phone);
  const isValid = await verifyPhoneOtp(phone, otp);
  if (!isValid) throw new Error("Failed: Valid OTP was rejected!");

  const isInvalid = await verifyPhoneOtp(phone, "000000");
  if (isInvalid) throw new Error("Failed: Invalid OTP was accepted!");

  console.log("Passed 1: OTP generation and verification logic validated.");

  const codOrder = await prisma.order.create({
    data: {
      orderNumber: `COD-ORD-${Date.now()}`,
      status: "AWAITING_DELIVERY_PAYMENT",
      paymentProvider: "CASH_ON_DELIVERY",
      customerName: "Ama Serwaa",
      customerPhone: phone,
      region: "Accra",
      city: "Osu",
      addressLine: "Osu Oxford Street",
      itemsPrice: 29900,
      shippingPrice: 2000,
      totalPrice: 31900,
      isCodOtpVerified: true,
    },
  });

  await recordCodCashCollection({
    orderId: codOrder.id,
    collectedAmountPesewas: 31900,
    collectorName: "Kwame Rider",
    notes: "Collected full cash upon delivery",
  });

  const updatedOrder = await prisma.order.findUnique({
    where: { id: codOrder.id },
  });

  if (updatedOrder?.status !== "DELIVERED") {
    throw new Error(`Expected DELIVERED order status, got ${updatedOrder?.status}`);
  }

  const codLog = await prisma.codReconciliationLog.findFirst({
    where: { orderId: codOrder.id },
  });

  if (!codLog || !codLog.isReconciled) {
    throw new Error("COD Reconciliation log entry missing or not reconciled!");
  }

  console.log("Passed 2: COD Cash Collection recorded and order marked DELIVERED.");
  console.log("ALL COD INTEGRATION TESTS PASSED!");
}

testCodFlow().catch((e) => {
  console.error("COD test failed:", e);
  process.exit(1);
});
