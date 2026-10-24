import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatGhs } from "@/lib/format";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";

const REVENUE_STATES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];
const NEEDS_ACTION_STATES = ["AWAITING_DELIVERY_PAYMENT", "PAID", "CONFIRMED", "ON_HOLD"];

export default async function AdminOverviewPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [revenue30d, ordersToday, needsAction, onHold, lowStock, recentOrders] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      _count: true,
      where: { status: { in: REVENUE_STATES }, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { status: { in: NEEDS_ACTION_STATES } } }),
    prisma.order.count({ where: { status: "ON_HOLD" } }),
    prisma.productVariant.findMany({
      where: { stock: { lte: 5 }, product: { isActive: true } },
      include: { product: { select: { title: true } } },
      orderBy: { stock: "asc" },
      take: 8,
    }),
    prisma.order.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
  ]);

  const stats = [
    { label: "Revenue (30 days)", value: formatGhs(revenue30d._sum.totalPrice ?? 0), sub: `${revenue30d._count} paid or delivered orders` },
    { label: "Orders today", value: String(ordersToday) },
    { label: "Need fulfilment", value: String(needsAction), href: "/admin/orders?status=open" },
    { label: "On hold", value: String(onHold), href: "/admin/orders?status=ON_HOLD", alert: onHold > 0 },
  ];

  return (
    <>
      <PageHeader title="Overview" description="Today at a glance" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <div className={`h-full rounded-lg border bg-white p-5 ${s.alert ? "border-orange-300" : "border-line"}`}>
              <p className="text-xs text-stone">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{s.value}</p>
              {s.sub && <p className="mt-1 text-xs text-stone">{s.sub}</p>}
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="block hover:opacity-90">
              {body}
            </Link>
          ) : (
            <div key={s.label}>{body}</div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <Panel title="Recent orders" className="overflow-hidden">
          <div className="-m-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-line">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FBFAF8]">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink hover:underline">
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs text-stone">{o.customerName}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-stone">{o.paymentProvider === "PAYSTACK" ? "Paystack" : "COD"}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3 text-right">{formatGhs(o.totalPrice)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td className="px-5 py-10 text-center text-stone">No orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Low stock">
          {lowStock.length === 0 ? (
            <p className="text-sm text-stone">All sizes are well stocked.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {lowStock.map((v) => (
                <li key={v.id} className="flex justify-between gap-3">
                  <span className="truncate text-ink">
                    {v.product.title} <span className="text-stone">· {v.size}</span>
                  </span>
                  <span className={v.stock === 0 ? "font-medium text-brand-red" : "text-orange-700"}>
                    {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/products" className="mt-4 inline-block text-xs text-brand-gold-dark hover:underline">
            Manage stock →
          </Link>
        </Panel>
      </div>
    </>
  );
}
