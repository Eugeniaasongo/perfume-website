import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/env";
import { formatGhs } from "@/lib/format";
import { SITE } from "@/lib/site";
import { sendSms } from "@/lib/notifications/sms";

type OrderForMessage = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  paymentProvider: string;
  totalPrice: number;
  refundedAmount: number;
  city: string;
  riderName: string | null;
  riderPhone: string | null;
};

function orderLink(order: OrderForMessage) {
  return `${getSiteUrl()}/orders/${order.orderNumber}?phone=${encodeURIComponent(order.customerPhone)}`;
}

const isCod = (order: OrderForMessage) => order.paymentProvider === "CASH_ON_DELIVERY";

/** Customer-facing SMS for each status. States without a template send nothing. */
const CUSTOMER_TEMPLATES: Record<string, (o: OrderForMessage) => string> = {
  ORDER_PLACED: (o) =>
    `RYZ Parfums: thank you ${o.customerName.split(" ")[0]}! Order ${o.orderNumber} is received. Pay ${formatGhs(o.totalPrice)} on delivery. Track: ${orderLink(o)}`,
  PAID: (o) =>
    `RYZ Parfums: payment of ${formatGhs(o.totalPrice)} received for order ${o.orderNumber}. We're preparing it now. Track: ${orderLink(o)}`,
  CONFIRMED: (o) => `RYZ Parfums: order ${o.orderNumber} is confirmed and being prepared for delivery.`,
  SHIPPED: (o) =>
    `RYZ Parfums: order ${o.orderNumber} is on its way${o.riderName ? ` with ${o.riderName}` : ""}${
      o.riderPhone ? ` (${o.riderPhone})` : ""
    }.${isCod(o) ? ` Please have ${formatGhs(o.totalPrice)} ready in cash or MoMo.` : ""}`,
  DELIVERED: (o) => `RYZ Parfums: order ${o.orderNumber} has been delivered. Thank you for choosing us!`,
  CANCELLED: (o) =>
    `RYZ Parfums: order ${o.orderNumber} has been cancelled. Questions? WhatsApp us on +${SITE.whatsapp}.`,
  REFUNDED: (o) =>
    `RYZ Parfums: a refund of ${formatGhs(o.refundedAmount)} for order ${o.orderNumber} has been issued.`,
  PARTIALLY_REFUNDED: (o) =>
    `RYZ Parfums: a refund of ${formatGhs(o.refundedAmount)} for order ${o.orderNumber} has been issued.`,
};

async function deliver(order: OrderForMessage | null, recipient: string, template: string, message: string) {
  let status = "SENT";
  let error: string | undefined;
  try {
    await sendSms(recipient, message);
  } catch (e) {
    status = "FAILED";
    error = e instanceof Error ? e.message : String(e);
    console.error(`[notifications] ${template} to ${recipient} failed: ${error}`);
  }
  try {
    await prisma.notificationLog.create({
      data: { orderId: order?.id, channel: "SMS", recipient, template, message, status, error },
    });
  } catch (e) {
    console.error("[notifications] could not write notification log", e);
  }
}

const orderSelect = {
  id: true,
  orderNumber: true,
  customerName: true,
  customerPhone: true,
  paymentProvider: true,
  totalPrice: true,
  refundedAmount: true,
  city: true,
  riderName: true,
  riderPhone: true,
} as const;

/**
 * Sends the customer SMS for an order event (a status, or ORDER_PLACED) and alerts the shop
 * about new orders. Never throws: a failed message must not undo a sale.
 */
export async function notifyOrderStatus(orderId: string, event: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: orderSelect });
    if (!order) return;

    const template = CUSTOMER_TEMPLATES[event];
    if (template) {
      await deliver(order, order.customerPhone, event, template(order));
    }

    // The shop hears about an order once it is real: COD when placed, online when paid.
    const isNewSale = (event === "ORDER_PLACED" && isCod(order)) || (event === "PAID" && !isCod(order));
    const adminPhone = process.env.ADMIN_ALERT_PHONE;
    if (isNewSale && adminPhone) {
      await deliver(
        order,
        adminPhone,
        "ADMIN_NEW_ORDER",
        `New RYZ order ${order.orderNumber}: ${formatGhs(order.totalPrice)} · ${
          isCod(order) ? "Cash on Delivery" : "Paid online"
        } · ${order.customerName}, ${order.city}`
      );
    }
  } catch (e) {
    console.error(`[notifications] failed for order ${orderId}`, e);
  }
}

/** Texts everyone waiting for a size that is back in stock. Returns how many were notified. */
export async function notifyBackInStock(variantId: string): Promise<number> {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { title: true, slug: true, isActive: true } } },
    });
    if (!variant || variant.stock <= 0 || !variant.product.isActive) return 0;

    const subscribers = await prisma.backInStockSubscriber.findMany({
      where: { variantId, notifiedAt: null, phone: { not: null } },
      take: 200,
    });

    const link = `${getSiteUrl()}/products/${variant.product.slug}`;
    for (const sub of subscribers) {
      await deliver(
        null,
        sub.phone!,
        "BACK_IN_STOCK",
        `RYZ Parfums: ${variant.product.title} ${variant.size} is back in stock. Shop now: ${link}`
      );
      await prisma.backInStockSubscriber.update({ where: { id: sub.id }, data: { notifiedAt: new Date() } });
    }
    return subscribers.length;
  } catch (e) {
    console.error(`[notifications] back-in-stock failed for ${variantId}`, e);
    return 0;
  }
}
