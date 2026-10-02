import { NextResponse } from "next/server";
import { sendPhoneOtp } from "@/lib/cod";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const result = await sendPhoneOtp(phone);
    return NextResponse.json({ success: true, otp: result.otp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 500 });
  }
}
