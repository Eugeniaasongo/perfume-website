import { NextResponse } from "next/server";
import { quoteCart, quoteSchema, CheckoutError } from "@/lib/orders/checkout";
import { jsonError, readJson, zodErrorResponse } from "@/lib/api";

export async function POST(request: Request) {
  const parsed = quoteSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const quote = await quoteCart(parsed.data);
    return NextResponse.json({ success: true, quote });
  } catch (error) {
    if (error instanceof CheckoutError) return jsonError(error.message, error.status);
    console.error("Quote error:", error);
    return jsonError("Unable to price your cart right now", 500);
  }
}
