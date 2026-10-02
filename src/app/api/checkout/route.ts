import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateShippingFeePesewas, validateAndApplyDiscount } from "@/lib/pricing";
import { PaystackProvider } from "@/lib/payments/paystack";
import { verifyPhoneOtp } from "@/lib/cod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      region,
      city,
      addressLine,
      landmark,
      paymentProvider, // PAYSTACK or CASH_ON_DELIVERY
      otp,
      discountCode,
      items, // Array of { variantId (UUID or SKU), quantity }
    } = body;

    if (!customerName || !customerPhone || !region || !city || !addressLine || !items || !items.length) {
      return NextResponse.json(
        { error: "Missing required checkout fields" },
        { status: 400 }
      );
    }

    // COD requires valid Phone OTP verification
    if (paymentProvider === "CASH_ON_DELIVERY") {
      if (!otp) {
        return NextResponse.json({ error: "Phone OTP is required for COD orders" }, { status: 400 });
      }
      const isOtpValid = await verifyPhoneOtp(customerPhone, otp);
      if (!isOtpValid) {
        return NextResponse.json({ error: "Invalid or expired Phone OTP" }, { status: 400 });
      }
    }

    // Calculate items price strictly in integer pesewas from DB
    let itemsPricePesewas = 0;
    const orderItemsData: {
      variantId: string;
      quantity: number;
      unitPricePesewas: number;
      totalPesewas: number;
    }[] = [];

    for (const item of items) {
      // Find variant by either UUID id or SKU code
      const variant = await prisma.productVariant.findFirst({
        where: {
          OR: [
            { id: item.variantId },
            { sku: item.variantId },
          ],
        },
      });

      if (!variant || variant.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for item size ${variant?.size || item.variantId}` },
          { status: 400 }
        );
      }

      const itemTotal = variant.pricePesewas * item.quantity;
      itemsPricePesewas += itemTotal;

      orderItemsData.push({
        variantId: variant.id,
        quantity: item.quantity,
        unitPricePesewas: variant.pricePesewas,
        totalPesewas: itemTotal,
      });
    }

    // Shipping calculation
    const shippingPricePesewas = calculateShippingFeePesewas(region, itemsPricePesewas);

    // Discount code application
    let discountPricePesewas = 0;
    if (discountCode) {
      const discountResult = await validateAndApplyDiscount({
        code: discountCode,
        itemsPricePesewas,
      });
      if (discountResult.valid) {
        discountPricePesewas = discountResult.discountPesewas;
      }
    }

    const totalPricePesewas = Math.max(
      0,
      itemsPricePesewas + shippingPricePesewas - discountPricePesewas
    );

    const orderNumber = `RYZ-${Math.floor(100000 + Math.random() * 900000)}`;
    const initialStatus = paymentProvider === "CASH_ON_DELIVERY" ? "AWAITING_DELIVERY_PAYMENT" : "PENDING_PAYMENT";

    // Atomically create order & reserve stock
    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock for resolved variants
      for (const itemData of orderItemsData) {
        await tx.productVariant.update({
          where: { id: itemData.variantId },
          data: { stock: { decrement: itemData.quantity } },
        });
      }

      return tx.order.create({
        data: {
          orderNumber,
          status: initialStatus,
          paymentProvider,
          customerName,
          customerEmail,
          customerPhone,
          region,
          city,
          addressLine,
          landmark,
          itemsPrice: itemsPricePesewas,
          shippingPrice: shippingPricePesewas,
          discountPrice: discountPricePesewas,
          totalPrice: totalPricePesewas,
          isCodOtpVerified: paymentProvider === "CASH_ON_DELIVERY",
          items: {
            create: orderItemsData,
          },
        },
      });
    });

    if (paymentProvider === "PAYSTACK") {
      const paystack = new PaystackProvider();
      const initResult = await paystack.initializeTransaction({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amountPesewas: order.totalPrice,
        email: customerEmail || "guest@ryzparfums.com",
        callbackUrl: `${request.headers.get("origin") || "http://localhost:3000"}/tracking?orderNumber=${order.orderNumber}`,
      });

      return NextResponse.json({
        success: true,
        orderNumber: order.orderNumber,
        authorizationUrl: initResult.authorizationUrl,
      });
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      message: "Order placed successfully! Cash on Delivery confirmed.",
    });
  } catch (error: any) {
    console.error("Checkout Processing Error:", error);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 });
  }
}
