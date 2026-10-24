import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatGhs } from "@/lib/format";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { createDiscountAction, toggleDiscountAction } from "../../catalog-actions";

export const metadata: Metadata = { title: "Discount codes" };

const input = "field-input mt-1 rounded-md py-2";
const label = "block text-xs text-stone";

export default async function AdminDiscountsPage() {
  const codes = await prisma.discountCode.findMany({ orderBy: [{ isActive: "desc" }, { code: "asc" }] });
  const now = new Date();

  return (
    <>
      <PageHeader title="Discount codes" description="Codes customers can enter at checkout" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-line bg-[#FBFAF8] text-xs text-stone">
              <tr>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Discount</th>
                <th className="px-5 py-3 font-medium">Rules</th>
                <th className="px-5 py-3 font-medium">Used</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {codes.map((c) => {
                const expired = c.expiresAt && c.expiresAt < now;
                const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
                const live = c.isActive && !expired && !exhausted;
                return (
                  <tr key={c.id} className={live ? "" : "text-stone"}>
                    <td className="px-5 py-3 font-medium">
                      {c.code}
                      <span className={`ml-2 text-xs ${live ? "text-emerald-700" : "text-stone"}`}>
                        {live ? "Live" : !c.isActive ? "Off" : expired ? "Expired" : "Used up"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {c.percentageOff ? `${c.percentageOff}% off` : c.amountOffGhs ? `${formatGhs(c.amountOffGhs)} off` : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-stone">
                      {c.minSpendGhs > 0 ? `Min ${formatGhs(c.minSpendGhs)}` : "No minimum"}
                      {c.expiresAt && ` · until ${c.expiresAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}`}
                    </td>
                    <td className="px-5 py-3">
                      {c.usedCount}
                      {c.maxUses ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <form action={toggleDiscountAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="rounded-md border border-line px-3 py-1 text-xs hover:border-ink">
                          {c.isActive ? "Turn off" : "Turn on"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-stone">
                    No discount codes yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Panel title="New code">
          <ActionForm action={createDiscountAction} submitLabel="Create code" resetOnSuccess className="space-y-3">
            <label className={label}>
              Code
              <input name="code" required placeholder="EID20" className={`${input} uppercase`} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                Type
                <select name="kind" className={input}>
                  <option value="percent">% off</option>
                  <option value="amount">GHS off</option>
                </select>
              </label>
              <label className={label}>
                Value
                <input name="value" type="number" step="0.01" min="0.01" required className={input} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                Minimum spend (GHS)
                <input name="minSpendGhs" type="number" step="0.01" min="0" defaultValue={0} className={input} />
              </label>
              <label className={label}>
                Max uses (0 = unlimited)
                <input name="maxUses" type="number" min="0" defaultValue={0} className={input} />
              </label>
            </div>
            <label className={label}>
              Expires (optional)
              <input name="expiresAt" type="date" className={input} />
            </label>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
