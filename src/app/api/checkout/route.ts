import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/env";
import { verifyPhoneOtp } from "@/lib/otp";
import { PaystackProvider } from "@/lib/payments/paystack";
import { transitionOrderState } from "@/lib/orders/state-machine";
import { notifyOrderStatus } from "@/lib/notifications/orders";
import { checkoutSchema, createOrder, CheckoutError } from "@/lib/orders/checkout";
import { jsonError, readJson, zodErrorResponse } from "@/lib/api";

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const input = parsed.data;

  try {
    const isCod = input.paymentProvider === "CASH_ON_DELIVERY";

    if (isCod) {
      const blacklisted = await prisma.customer.findUnique({
        where: { phone: input.customerPhone },
        select: { isBlacklisted: true },
      });
      if (blacklisted?.isBlacklisted) {
        return jsonError("Cash on Delivery isn't available for this number. Please pay online.", 403);
      }
      if (!(await verifyPhoneOtp(input.customerPhone, input.otp!))) {
        return jsonError("That verification code is invalid or has expired", 400, {
          otp: "Invalid or expired code",
        });
      }
    }

    const order = await createOrder({ ...input, isCodOtpVerified: isCod });
    const orderUrl = `${getSiteUrl()}/orders/${order.orderNumber}?phone=${encodeURIComponent(order.customerPhone)}`;

    if (input.paymentProvider === "PAYSTACK") {
      try {
        const paystack = new PaystackProvider();
        const { authorizationUrl } = await paystack.initializeTransaction({
          orderId: order.id,
          orderNumber: order.orderNumber,
          amountPesewas: order.totalPrice,
          email: input.customerEmail!,
          callbackUrl: orderUrl,
        });
        return NextResponse.json({ success: true, orderNumber: order.orderNumber, redirectUrl: authorizationUrl });
      } catch (error) {
        console.error(`Paystack init failed for ${order.orderNumber}:`, error);
        await transitionOrderState({
          orderId: order.id,
          targetState: "PAYMENT_FAILED",
          actor: "SYSTEM",
          notes: "Payment gateway initialization failed",
        });
        return jsonError("We couldn't reach the payment gateway. No money was taken — please try again.", 502);
      }
    }

    await notifyOrderStatus(order.id, "ORDER_PLACED");
    return NextResponse.json({ success: true, orderNumber: order.orderNumber, redirectUrl: orderUrl });
  } catch (error) {
    if (error instanceof CheckoutError) return jsonError(error.message, error.status);
    console.error("Checkout processing error:", error);
    return jsonError("Something went wrong placing your order. Please try again.", 500);
  }
}
