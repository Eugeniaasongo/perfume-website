import { NextResponse } from "next/server";
import { processPaystackWebhookEvent, WebhookSignatureError } from "@/lib/payments/paystack";

export async function POST(request: Request) {
  const signature = request.headers.get("x-paystack-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Paystack signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  try {
    const result = await processPaystackWebhookEvent(rawBody, signature);
    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    if (error instanceof WebhookSignatureError) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }
    // Non-2xx makes Paystack retry, which is what we want for transient failures.
    console.error("Paystack webhook handler error:", error);
    return NextResponse.json({ success: false, error: "Processing failed" }, { status: 500 });
  }
}
