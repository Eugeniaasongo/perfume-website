import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { isProduction } from "@/lib/env";
import { isSmsConfigured, sendSms } from "@/lib/notifications/sms";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_SENDS_PER_HOUR = 5;
export const OTP_MAX_ATTEMPTS = 5;

export class OtpError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
  }
}

function hashCode(phone: string, code: string): string {
  const secret = process.env.SESSION_SECRET || "dev-otp-secret";
  return crypto.createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
}

/**
 * Issues a 6-digit OTP for an already-normalized phone number.
 * `devCode` is only returned when no SMS provider is configured outside production.
 */
export async function sendPhoneOtp(phone: string): Promise<{ devCode?: string }> {
  const now = Date.now();
  const recent = await prisma.phoneOtp.findMany({
    where: { phone, createdAt: { gte: new Date(now - 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (recent[0] && now - recent[0].createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    throw new OtpError("Please wait a minute before requesting another code.", 429);
  }
  if (recent.length >= OTP_MAX_SENDS_PER_HOUR) {
    throw new OtpError("Too many verification codes requested. Please try again later.", 429);
  }

  const code = crypto.randomInt(100000, 1000000).toString();

  await prisma.phoneOtp.create({
    data: {
      phone,
      codeHash: hashCode(phone, code),
      expiresAt: new Date(now + OTP_TTL_MS),
    },
  });

  await sendSms(phone, `Your RYZ Parfums verification code is ${code}. It expires in 10 minutes.`);

  return !isProduction && !isSmsConfigured() ? { devCode: code } : {};
}

/** Verifies and consumes the latest OTP for a phone number. */
export async function verifyPhoneOtp(phone: string, code: string): Promise<boolean> {
  const otp = await prisma.phoneOtp.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) return false;

  const expected = Buffer.from(otp.codeHash, "hex");
  const actual = Buffer.from(hashCode(phone, code.trim()), "hex");
  const isMatch = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

  if (!isMatch) {
    await prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  // Conditional update so the same code can't be redeemed twice concurrently.
  const consumed = await prisma.phoneOtp.updateMany({
    where: { id: otp.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return consumed.count === 1;
}
