import { NextResponse } from "next/server";
import { processPaystackWebhookEvent } from "@/lib/payments/paystack";

export async function POST(request: Request) {
  const signature = request.headers.get("x-paystack-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Paystack signature" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  try {
    const result = await processPaystackWebhookEvent(rawBody, signature);
    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error: any) {
    console.error("Paystack Webhook Handler Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
