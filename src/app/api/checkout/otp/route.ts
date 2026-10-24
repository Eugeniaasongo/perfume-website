import { NextResponse } from "next/server";
import { sendPhoneOtp, OtpError } from "@/lib/otp";
import { phoneInputSchema } from "@/lib/orders/checkout";
import { jsonError, readJson, zodErrorResponse } from "@/lib/api";

export async function POST(request: Request) {
  const parsed = phoneInputSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const { devCode } = await sendPhoneOtp(parsed.data.phone);
    return NextResponse.json({ success: true, devCode });
  } catch (error) {
    if (error instanceof OtpError) return jsonError(error.message, error.status);
    console.error("OTP send error:", error);
    return jsonError("We couldn't send a verification code right now. Please try again shortly.", 503);
  }
}
