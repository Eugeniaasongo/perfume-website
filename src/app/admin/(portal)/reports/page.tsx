import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { formatGhs } from "@/lib/format";
import { getSalesReport } from "@/lib/reports";
import { PageHeader, Panel } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Reports" };

const RANGES = [7, 30, 90];

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: daysParam } = await searchParams;
  const days = RANGES.includes(Number(daysParam)) ? Number(daysParam) : 30;
  const report = await getSalesReport(days);
  const maxDaily = Math.max(1, ...report.daily.map((d) => d.salesPesewas));

  const stats = [
    { label: "Sales", value: formatGhs(report.grossSalesPesewas), sub: `${report.orderCount} orders` },
    { label: "Average order", value: formatGhs(report.averageOrderPesewas) },
    { label: "Money received", value: formatGhs(report.collectedPesewas), sub: "Paystack + COD cash, minus refunds" },
    {
      label: "COD still to collect",
      value: formatGhs(report.codOutstandingPesewas),
      sub: `${report.codOutstandingCount} open order${report.codOutstandingCount === 1 ? "" : "s"}`,
    },
  ];

  return (
    <>
      <PageHeader title="Reports" description={`Since ${report.since.toLocaleDateString("en-GB", { dateStyle: "medium" })}`}>
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/reports?days=${r}`}
              className={`rounded-md border px-3 py-1.5 text-sm ${r === days ? "border-ink bg-ink text-ivory" : "border-line bg-white hover:border-ink"}`}
            >
              {r} days
            </Link>
          ))}
          <a
            href={`/api/admin/orders/export?days=${days}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"
          >
            <Download size={14} /> Export CSV
          </a>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-line bg-white p-5">
            <p className="text-xs text-stone">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{s.value}</p>
            {s.sub && <p className="mt-1 text-xs text-stone">{s.sub}</p>}
          </div>
        ))}
      </div>

      <Panel title="Daily sales" className="mt-6">
        <div className="flex h-40 items-end gap-[3px]" role="img" aria-label="Daily sales chart">
          {report.daily.map((d) => (
            <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className="min-h-[2px] rounded-sm bg-brand-gold/80 group-hover:bg-brand-gold-dark"
                style={{ height: `${(d.salesPesewas / maxDaily) * 100}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] text-ivory group-hover:block">
                {d.date}: {formatGhs(d.salesPesewas)} · {d.orders} order{d.orders === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-stone">
          <span>{report.daily[0]?.date}</span>
          <span>{report.daily.at(-1)?.date}</span>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Top fragrances">
          {report.topProducts.length === 0 ? (
            <p className="text-sm text-stone">No sales in this period yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-stone">
                <tr>
                  <th className="pb-2 font-normal">Fragrance</th>
                  <th className="pb-2 text-right font-normal">Units</th>
                  <th className="pb-2 text-right font-normal">Sales (excl. delivery)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.topProducts.map((p) => (
                  <tr key={p.title}>
                    <td className="py-2">{p.title}</td>
                    <td className="py-2 text-right">{p.units}</td>
                    <td className="py-2 text-right">{formatGhs(p.revenuePesewas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Payment methods & losses">
          <ul className="space-y-2 text-sm">
            {report.byPayment.map((p) => (
              <li key={p.method} className="flex justify-between">
                <span>{p.method === "PAYSTACK" ? "Paid online" : "Cash on Delivery"}</span>
                <span>
                  {p.orders} · {formatGhs(p.salesPesewas)}
                </span>
              </li>
            ))}
            {report.byPayment.length === 0 && <li className="text-stone">No sales in this period yet.</li>}
          </ul>
          <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <li className="flex justify-between">
              <span className="text-stone">Refunded</span>
              <span>{formatGhs(report.refundedPesewas)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-stone">Cancelled orders</span>
              <span>{report.cancelledCount}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-stone">Refused deliveries</span>
              <span className={report.refusedCount > 0 ? "text-orange-700" : ""}>{report.refusedCount}</span>
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
