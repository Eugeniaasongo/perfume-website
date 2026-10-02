import { prisma } from "@/lib/prisma";

const activeOtps = new Map<string, string>();

export async function sendPhoneOtp(phone: string): Promise<{ success: boolean; otp: string }> {
  const formattedPhone = phone.trim().replace(/\s+/g, "");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  activeOtps.set(formattedPhone, otp);

  console.log(`[OTP Service] Sent OTP ${otp} to phone ${formattedPhone}`);
  return { success: true, otp };
}

export async function verifyPhoneOtp(phone: string, otp: string): Promise<boolean> {
  const formattedPhone = phone.trim().replace(/\s+/g, "");
  const expectedOtp = activeOtps.get(formattedPhone);

  if (expectedOtp && expectedOtp === otp) {
    activeOtps.delete(formattedPhone);
    return true;
  }
  return false;
}

export async function recordCodCashCollection(input: {
  orderId: string;
  collectedAmountPesewas: number;
  collectorName: string;
  notes?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
  });

  if (!order) {
    throw new Error(`Order ${input.orderId} not found`);
  }

  const isAmountMatch = order.totalPrice === input.collectedAmountPesewas;

  const result = await prisma.$transaction([
    prisma.codReconciliationLog.create({
      data: {
        orderId: order.id,
        collectedAmount: input.collectedAmountPesewas,
        collectorName: input.collectorName,
        isReconciled: isAmountMatch,
        notes: input.notes || (isAmountMatch ? "Full cash collected" : "Amount discrepancy flagged"),
      },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: isAmountMatch ? "DELIVERED" : "ON_HOLD",
      },
    }),
  ]);

  return result;
}
