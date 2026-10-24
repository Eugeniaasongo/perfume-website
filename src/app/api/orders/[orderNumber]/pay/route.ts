import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/env";
import { normalizeGhanaPhone } from "@/lib/phone";
import { PaystackProvider } from "@/lib/payments/paystack";
import { jsonError, readJson } from "@/lib/api";

const schema = z.object({ phone: z.string().max(30) });

/** Starts a fresh Paystack checkout for an unpaid order (e.g. the customer closed the payment page). */
export async function POST(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const parsed = schema.safeParse(await readJson(request));
  const phone = parsed.success ? normalizeGhanaPhone(parsed.data.phone) : null;

  const order = await prisma.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() } });
  if (!order || !phone || order.customerPhone !== phone) {
    return jsonError("Order not found", 404);
  }
  if (order.paymentProvider !== "PAYSTACK" || order.status !== "PENDING_PAYMENT") {
    return jsonError("This order doesn't need payment", 409);
  }
  if (!order.customerEmail) {
    return jsonError("This order has no email address for the payment receipt", 409);
  }

  try {
    const { authorizationUrl } = await new PaystackProvider().initializeTransaction({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountPesewas: order.totalPrice,
      email: order.customerEmail,
      callbackUrl: `${getSiteUrl()}/orders/${order.orderNumber}?phone=${encodeURIComponent(order.customerPhone)}`,
    });
    return NextResponse.json({ success: true, redirectUrl: authorizationUrl });
  } catch (error) {
    console.error(`Payment retry failed for ${order.orderNumber}:`, error);
    return jsonError("We couldn't reach the payment gateway. Please try again in a moment.", 502);
  }
}
