import { prisma } from "@/lib/prisma";

/** Orders that represent a real sale (excludes abandoned, failed and cancelled checkouts). */
export const SALE_EXCLUDED_STATES = ["PENDING_PAYMENT", "PAYMENT_FAILED", "CANCELLED"];
const COD_OUTSTANDING_STATES = ["AWAITING_DELIVERY_PAYMENT", "CONFIRMED", "PROCESSING", "SHIPPED"];

export interface SalesReport {
  since: Date;
  orderCount: number;
  grossSalesPesewas: number;
  averageOrderPesewas: number;
  collectedPesewas: number;
  refundedPesewas: number;
  codOutstandingPesewas: number;
  codOutstandingCount: number;
  cancelledCount: number;
  refusedCount: number;
  byPayment: { method: string; orders: number; salesPesewas: number }[];
  topProducts: { title: string; units: number; revenuePesewas: number }[];
  daily: { date: string; orders: number; salesPesewas: number }[];
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export async function getSalesReport(days: number, now = new Date()): Promise<SalesReport> {
  const since = new Date(now);
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const [orders, closedCounts, charges, codCollections, refunds, outstanding] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { notIn: SALE_EXCLUDED_STATES } },
      select: {
        createdAt: true,
        totalPrice: true,
        paymentProvider: true,
        items: {
          select: { quantity: true, totalPesewas: true, variant: { select: { product: { select: { title: true } } } } },
        },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since }, status: { in: ["CANCELLED", "RETURNED_REFUSED"] } },
      _count: true,
    }),
    prisma.paymentLedger.aggregate({
      _sum: { amountPesewas: true },
      where: { createdAt: { gte: since }, provider: "PAYSTACK", status: "SUCCESS" },
    }),
    prisma.codReconciliationLog.aggregate({ _sum: { collectedAmount: true }, where: { collectedAt: { gte: since } } }),
    prisma.paymentLedger.aggregate({ _sum: { amountPesewas: true }, where: { createdAt: { gte: since }, status: "REFUNDED" } }),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      _count: true,
      where: { paymentProvider: "CASH_ON_DELIVERY", status: { in: COD_OUTSTANDING_STATES } },
    }),
  ]);

  const grossSalesPesewas = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const refundedPesewas = refunds._sum.amountPesewas ?? 0;

  const payment = new Map<string, { orders: number; salesPesewas: number }>();
  const products = new Map<string, { units: number; revenuePesewas: number }>();
  const daily = new Map<string, { orders: number; salesPesewas: number }>();

  for (let d = new Date(since); d <= now; d.setUTCDate(d.getUTCDate() + 1)) {
    daily.set(dayKey(d), { orders: 0, salesPesewas: 0 });
  }

  for (const o of orders) {
    const p = payment.get(o.paymentProvider) ?? { orders: 0, salesPesewas: 0 };
    p.orders += 1;
    p.salesPesewas += o.totalPrice;
    payment.set(o.paymentProvider, p);

    const day = daily.get(dayKey(o.createdAt));
    if (day) {
      day.orders += 1;
      day.salesPesewas += o.totalPrice;
    }

    for (const item of o.items) {
      const title = item.variant.product.title;
      const entry = products.get(title) ?? { units: 0, revenuePesewas: 0 };
      entry.units += item.quantity;
      entry.revenuePesewas += item.totalPesewas;
      products.set(title, entry);
    }
  }

  const countFor = (status: string) => closedCounts.find((c) => c.status === status)?._count ?? 0;

  return {
    since,
    orderCount: orders.length,
    grossSalesPesewas,
    averageOrderPesewas: orders.length ? Math.round(grossSalesPesewas / orders.length) : 0,
    collectedPesewas: (charges._sum.amountPesewas ?? 0) + (codCollections._sum.collectedAmount ?? 0) - refundedPesewas,
    refundedPesewas,
    codOutstandingPesewas: outstanding._sum.totalPrice ?? 0,
    codOutstandingCount: outstanding._count,
    cancelledCount: countFor("CANCELLED"),
    refusedCount: countFor("RETURNED_REFUSED"),
    byPayment: [...payment].map(([method, v]) => ({ method, ...v })),
    topProducts: [...products]
      .map(([title, v]) => ({ title, ...v }))
      .sort((a, b) => b.revenuePesewas - a.revenuePesewas)
      .slice(0, 10),
    daily: [...daily].map(([date, v]) => ({ date, ...v })),
  };
}

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  // Neutralise spreadsheet formulas and quote everything.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function exportOrdersCsv(since: Date): Promise<string> {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    include: { items: { include: { variant: { include: { product: { select: { title: true } } } } } } },
  });

  const header = [
    "Order", "Date", "Status", "Payment", "Customer", "Phone", "Email", "Region", "City", "Address",
    "Items", "Subtotal (GHS)", "Delivery (GHS)", "Discount (GHS)", "Discount code", "Total (GHS)", "Refunded (GHS)", "Rider",
  ];
  const ghs = (p: number) => (p / 100).toFixed(2);

  const rows = orders.map((o) => [
    o.orderNumber,
    o.createdAt.toISOString(),
    o.status,
    o.paymentProvider,
    o.customerName,
    o.customerPhone,
    o.customerEmail,
    o.region,
    o.city,
    o.addressLine,
    o.items.map((i) => `${i.variant.product.title} ${i.variant.size} x${i.quantity}`).join("; "),
    ghs(o.itemsPrice),
    ghs(o.shippingPrice),
    ghs(o.discountPrice),
    o.discountCode,
    ghs(o.totalPrice),
    ghs(o.refundedAmount),
    o.riderName,
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
