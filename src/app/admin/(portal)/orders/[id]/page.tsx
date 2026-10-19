import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatGhs } from "@/lib/format";
import { allowedTransitions, ORDER_STATE_LABELS, type OrderState } from "@/lib/orders/state-machine";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { recordCodAction, transitionOrderAction } from "../../../actions";

export const metadata: Metadata = { title: "Order" };

const DESTRUCTIVE: OrderState[] = ["CANCELLED", "REFUNDED", "RETURNED_REFUSED", "PAYMENT_FAILED"];

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: { include: { product: { select: { title: true } } } } } },
      paymentLedgers: { orderBy: { createdAt: "desc" } },
      codLogs: { orderBy: { collectedAt: "desc" } },
      auditLogs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const status = order.status as OrderState;
  const nextStates = allowedTransitions[status] ?? [];
  const canCollectCash =
    order.paymentProvider === "CASH_ON_DELIVERY" && nextStates.includes("DELIVERED");

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-stone hover:text-ink">
        <ArrowLeft size={14} /> Orders
      </Link>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${order.createdAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}`}
      >
        <StatusBadge status={order.status} />
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y divide-line text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-2.5 first:pt-0">
                  <span>
                    {item.variant.product.title}{" "}
                    <span className="text-stone">
                      · {item.variant.size} · {item.variant.sku}
                    </span>
                  </span>
                  <span className="whitespace-nowrap">
                    {item.quantity} × {formatGhs(item.unitPricePesewas)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone">Subtotal</dt>
                <dd>{formatGhs(order.itemsPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone">Delivery</dt>
                <dd>{formatGhs(order.shippingPrice)}</dd>
              </div>
              {order.discountPrice > 0 && (
                <div className="flex justify-between">
                  <dt className="text-stone">Discount {order.discountCode && `(${order.discountCode})`}</dt>
                  <dd>−{formatGhs(order.discountPrice)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-1 font-semibold">
                <dt>Total</dt>
                <dd>{formatGhs(order.totalPrice)}</dd>
              </div>
            </dl>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Customer">
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-stone">Name</dt>
                  <dd>{order.customerName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone">Phone</dt>
                  <dd>
                    <a href={`tel:${order.customerPhone}`} className="hover:underline">
                      {order.customerPhone}
                    </a>{" "}
                    {order.isCodOtpVerified && <span className="text-xs text-emerald-700">· verified</span>}
                  </dd>
                </div>
                {order.customerEmail && (
                  <div>
                    <dt className="text-xs text-stone">Email</dt>
                    <dd>{order.customerEmail}</dd>
                  </div>
                )}
              </dl>
            </Panel>
            <Panel title="Delivery">
              <address className="space-y-1 text-sm not-italic">
                <p>{order.addressLine}</p>
                <p>
                  {order.city}, {order.region}
                </p>
                {order.landmark && <p className="text-stone">Landmark: {order.landmark}</p>}
                {order.ghanaPostGps && <p className="text-stone">GPS: {order.ghanaPostGps}</p>}
              </address>
            </Panel>
          </div>

          <Panel title="Activity">
            <ol className="space-y-3 text-sm">
              {order.auditLogs.map((log) => (
                <li key={log.id} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                  <div>
                    <p className="text-ink">{log.details ?? log.action}</p>
                    <p className="text-xs text-stone">
                      {log.actor} · {log.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </li>
              ))}
              {order.paymentLedgers.map((p) => (
                <li key={p.id} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <div>
                    <p className="text-ink">
                      {p.provider} payment {p.status.toLowerCase().replace("_", " ")} · {formatGhs(p.amountPesewas)}
                    </p>
                    <p className="text-xs text-stone">{p.reference}</p>
                  </div>
                </li>
              ))}
              {order.codLogs.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${c.isReconciled ? "bg-emerald-600" : "bg-orange-500"}`} />
                  <div>
                    <p className="text-ink">
                      Cash collected by {c.collectorName}: {formatGhs(c.collectedAmount)}
                      {!c.isReconciled && " (discrepancy)"}
                    </p>
                    {c.notes && <p className="text-xs text-stone">{c.notes}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          {canCollectCash && (
            <Panel title="Record cash collection">
              <ActionForm action={recordCodAction} submitLabel="Record & mark delivered" className="space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <label className="block text-xs text-stone">
                  Amount collected (GHS)
                  <input
                    name="collectedGhs"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={(order.totalPrice / 100).toFixed(2)}
                    required
                    className="field-input mt-1 rounded-md py-2"
                  />
                </label>
                <label className="block text-xs text-stone">
                  Rider / collector
                  <input name="collectorName" required minLength={2} className="field-input mt-1 rounded-md py-2" />
                </label>
                <label className="block text-xs text-stone">
                  Notes
                  <input name="notes" className="field-input mt-1 rounded-md py-2" />
                </label>
              </ActionForm>
            </Panel>
          )}

          <Panel title="Update status">
            {nextStates.length === 0 ? (
              <p className="text-sm text-stone">This order is closed.</p>
            ) : (
              <div className="space-y-2">
                {nextStates
                  .filter((s) => !(canCollectCash && s === "DELIVERED"))
                  .map((target) => (
                    <ActionForm
                      key={target}
                      action={transitionOrderAction}
                      submitLabel={`Mark as ${ORDER_STATE_LABELS[target].toLowerCase()}`}
                      confirm={
                        DESTRUCTIVE.includes(target)
                          ? `Mark ${order.orderNumber} as ${ORDER_STATE_LABELS[target].toLowerCase()}? Reserved stock will be returned.`
                          : undefined
                      }
                      submitClassName={`w-full rounded-md border px-4 py-2 text-left text-sm disabled:opacity-50 ${
                        DESTRUCTIVE.includes(target)
                          ? "border-red-200 text-red-700 hover:bg-red-50"
                          : "border-line text-ink hover:border-ink"
                      }`}
                    >
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="targetState" value={target} />
                    </ActionForm>
                  ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
