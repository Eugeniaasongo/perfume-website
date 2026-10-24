import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatGhs } from "@/lib/format";
import { normalizeGhanaPhone } from "@/lib/phone";
import { ORDER_STATE_LABELS } from "@/lib/orders/state-machine";
import { PageHeader, StatusBadge } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 25;
const OPEN_STATES = ["AWAITING_DELIVERY_PAYMENT", "PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "ON_HOLD"];

interface OrdersPageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const { status = "", q = "", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const query = q.trim();

  const where: Prisma.OrderWhereInput = {
    ...(status === "open" ? { status: { in: OPEN_STATES } } : status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query, mode: "insensitive" } },
            { customerName: { contains: query, mode: "insensitive" } },
            { customerPhone: { contains: normalizeGhanaPhone(query) ?? query } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Orders" description={`${total} order${total === 1 ? "" : "s"}`} />

      <form className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search order number, name or phone"
          className="field-input flex-1 rounded-md py-2"
        />
        <select name="status" defaultValue={status} className="field-input rounded-md py-2 sm:w-56">
          <option value="">All statuses</option>
          <option value="open">Open (needs action)</option>
          {Object.entries(ORDER_STATE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-ink px-4 py-2 text-sm text-ivory">Filter</button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-[#FBFAF8] text-xs text-stone">
            <tr>
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-[#FBFAF8]">
                <td className="px-5 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink hover:underline">
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-stone">
                    {o.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · {o._count.items} item
                    {o._count.items === 1 ? "" : "s"}
                  </p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-ink">{o.customerName}</p>
                  <p className="text-xs text-stone">
                    {o.customerPhone} · {o.city}
                  </p>
                </td>
                <td className="px-5 py-3 text-xs text-stone">{o.paymentProvider === "PAYSTACK" ? "Paystack" : "Cash on Delivery"}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-5 py-3 text-right">{formatGhs(o.totalPrice)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-stone">
                  No orders match these filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
          <span className="text-stone">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link href={pageHref(currentPage - 1)} className="rounded-md border border-line bg-white px-3 py-1.5 hover:border-ink">
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link href={pageHref(currentPage + 1)} className="rounded-md border border-line bg-white px-3 py-1.5 hover:border-ink">
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
