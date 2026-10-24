import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatGhs } from "@/lib/format";
import { allowedTransitions, ORDER_STATE_LABELS, type OrderState } from "@/lib/orders/state-machine";
import { refundableAmount } from "@/lib/orders/refunds";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import {
  recordCodAction,
  refundOrderAction,
  setCustomerBlockedAction,
  transitionOrderAction,
} from "../../../actions";

export const metadata: Metadata = { title: "Order" };

const DESTRUCTIVE: OrderState[] = ["CANCELLED", "RETURNED_REFUSED", "PAYMENT_FAILED"];
// Refunds go through the refund panel so money and status always move together.
const HANDLED_ELSEWHERE: OrderState[] = ["REFUNDED", "PARTIALLY_REFUNDED", "SHIPPED"];

const dateTime = (d: Date) => d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

const inputClass = "field-input mt-1 rounded-md py-2";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: { include: { product: { select: { title: true } } } } } },
      paymentLedgers: { orderBy: { createdAt: "desc" } },
      codLogs: { orderBy: { collectedAt: "desc" } },
      auditLogs: { orderBy: { createdAt: "desc" } },
      notifications: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!order) notFound();

  const customer = await prisma.customer.findUnique({ where: { phone: order.customerPhone } });

  const status = order.status as OrderState;
  const nextStates = allowedTransitions[status] ?? [];
  const isCod = order.paymentProvider === "CASH_ON_DELIVERY";
  const canCollectCash = isCod && nextStates.includes("DELIVERED");
  const canDispatch = nextStates.includes("SHIPPED");
  const refundable = refundableAmount(order);
  const canRefund =
    refundable > 0 && (nextStates.includes("REFUNDED") || nextStates.includes("PARTIALLY_REFUNDED") || status === "PARTIALLY_REFUNDED");
  const activity = [
    ...order.auditLogs.map((log) => ({
      id: log.id,
      at: log.createdAt,
      dot: "bg-brand-gold",
      text: log.details ?? log.action,
      meta: log.actor,
    })),
    ...order.paymentLedgers.map((p) => ({
      id: p.id,
      at: p.createdAt,
      dot: p.status === "REFUNDED" ? "bg-sky-600" : p.status === "SUCCESS" ? "bg-emerald-600" : "bg-orange-500",
      text:
        p.status === "REFUNDED"
          ? `Refund of ${formatGhs(p.amountPesewas)} ${p.provider === "COD_MANUAL" ? "paid back by hand" : "sent via Paystack"}`
          : `Paystack payment ${p.status === "SUCCESS" ? "received" : p.status.toLowerCase().replace("_", " ")}: ${formatGhs(p.amountPesewas)}`,
      meta: p.reference,
    })),
    ...order.codLogs.map((c) => ({
      id: c.id,
      at: c.collectedAt,
      dot: c.isReconciled ? "bg-emerald-600" : "bg-orange-500",
      text: `Cash collected: ${formatGhs(c.collectedAmount)}${c.isReconciled ? "" : " (doesn't match the total)"}${c.notes ? ` — ${c.notes}` : ""}`,
      meta: c.collectorName,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const statusButtons = nextStates.filter(
    (s) => !HANDLED_ELSEWHERE.includes(s) && !(canCollectCash && s === "DELIVERED")
  );

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-stone hover:text-ink">
        <ArrowLeft size={14} /> Orders
      </Link>
      <PageHeader title={`Order ${order.orderNumber}`} description={`Placed ${dateTime(order.createdAt)}`}>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/orders/${order.id}/slip`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"
          >
            <Printer size={14} /> Packing slip
          </Link>
          <StatusBadge status={order.status} />
        </div>
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
              {order.refundedAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Refunded</dt>
                  <dd>−{formatGhs(order.refundedAmount)}</dd>
                </div>
              )}
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
                {customer && (
                  <div>
                    <dt className="text-xs text-stone">History</dt>
                    <dd>
                      {customer.orderCount} order{customer.orderCount === 1 ? "" : "s"}
                      {customer.noShowCount > 0 && (
                        <span className="text-orange-700">
                          {" "}
                          · {customer.noShowCount} refused deliver{customer.noShowCount === 1 ? "y" : "ies"}
                        </span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 border-t border-line pt-4">
                {customer?.isBlacklisted ? (
                  <>
                    <p className="mb-2 text-xs text-brand-red">
                      Cash on Delivery blocked{customer.blockReason ? ` — ${customer.blockReason}` : ""}
                    </p>
                    <ActionForm
                      action={setCustomerBlockedAction}
                      submitLabel="Allow Cash on Delivery"
                      submitClassName="rounded-md border border-line px-3 py-1.5 text-xs hover:border-ink"
                      className="space-y-1"
                    >
                      <input type="hidden" name="phone" value={order.customerPhone} />
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="block" value="false" />
                    </ActionForm>
                  </>
                ) : (
                  <ActionForm
                    action={setCustomerBlockedAction}
                    submitLabel="Block Cash on Delivery"
                    confirm={`Block Cash on Delivery for ${order.customerPhone}? They can still pay online.`}
                    submitClassName="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                    className="space-y-1"
                  >
                    <input type="hidden" name="phone" value={order.customerPhone} />
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="block" value="true" />
                  </ActionForm>
                )}
              </div>
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
              {order.riderName && (
                <p className="mt-4 border-t border-line pt-4 text-sm">
                  Rider: {order.riderName}
                  {order.riderPhone && <span className="text-stone"> · {order.riderPhone}</span>}
                  {order.shippedAt && <span className="block text-xs text-stone">Dispatched {dateTime(order.shippedAt)}</span>}
                </p>
              )}
              {order.deliveryNote && <p className="mt-2 text-xs text-stone">Note: {order.deliveryNote}</p>}
            </Panel>
          </div>

          <Panel title="Activity">
            <ol className="space-y-3 text-sm">
              {activity.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${entry.dot}`} />
                  <div>
                    <p className="text-ink">{entry.text}</p>
                    <p className="text-xs text-stone">
                      {entry.meta} · {dateTime(entry.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Messages to customer">
            {order.notifications.length === 0 ? (
              <p className="text-sm text-stone">No messages sent yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {order.notifications.map((n) => (
                  <li key={n.id}>
                    <p className="flex items-center gap-2 text-xs">
                      <span className={n.status === "SENT" ? "text-emerald-700" : "text-brand-red"}>{n.status}</span>
                      <span className="text-stone">
                        {n.template.toLowerCase().replace(/_/g, " ")} · to {n.recipient} · {dateTime(n.createdAt)}
                      </span>
                    </p>
                    <p className="text-ink">{n.message}</p>
                    {n.error && <p className="text-xs text-brand-red">{n.error}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          {canDispatch && (
            <Panel title="Send out for delivery">
              <ActionForm action={transitionOrderAction} submitLabel="Mark out for delivery & text customer" className="space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="targetState" value="SHIPPED" />
                <label className="block text-xs text-stone">
                  Rider name
                  <input name="riderName" required minLength={2} defaultValue={order.riderName ?? ""} className={inputClass} />
                </label>
                <label className="block text-xs text-stone">
                  Rider phone (shared with the customer)
                  <input name="riderPhone" type="tel" defaultValue={order.riderPhone ?? ""} className={inputClass} />
                </label>
                <label className="block text-xs text-stone">
                  Internal note
                  <input name="deliveryNote" defaultValue={order.deliveryNote ?? ""} className={inputClass} />
                </label>
              </ActionForm>
            </Panel>
          )}

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
                    className={inputClass}
                  />
                </label>
                <label className="block text-xs text-stone">
                  Rider / collector
                  <input name="collectorName" required minLength={2} defaultValue={order.riderName ?? ""} className={inputClass} />
                </label>
                <label className="block text-xs text-stone">
                  Notes
                  <input name="notes" className={inputClass} />
                </label>
              </ActionForm>
            </Panel>
          )}

          <Panel title="Update status">
            {statusButtons.length === 0 ? (
              <p className="text-sm text-stone">
                {nextStates.length === 0 ? "This order is closed." : "Use the actions above."}
              </p>
            ) : (
              <div className="space-y-2">
                {statusButtons.map((target) => (
                  <ActionForm
                    key={target}
                    action={transitionOrderAction}
                    submitLabel={`Mark as ${ORDER_STATE_LABELS[target].toLowerCase()}`}
                    confirm={
                      DESTRUCTIVE.includes(target)
                        ? `Mark ${order.orderNumber} as ${ORDER_STATE_LABELS[target].toLowerCase()}? Reserved stock will be returned and the customer will be notified.`
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

          {canRefund && (
            <Panel title="Refund">
              <p className="mb-3 text-xs text-stone">
                {order.paymentProvider === "PAYSTACK"
                  ? "Sent back to the customer's card or MoMo through Paystack."
                  : "Pay the customer back in cash or MoMo, then record it here."}{" "}
                Up to {formatGhs(refundable)} can be refunded.
              </p>
              <ActionForm
                action={refundOrderAction}
                submitLabel="Issue refund"
                confirm={`Refund this order? This can't be undone.`}
                submitClassName="rounded-md bg-ink px-4 py-2 text-sm font-medium text-ivory hover:bg-brand-gold-dark disabled:opacity-50"
                className="space-y-3"
              >
                <input type="hidden" name="orderId" value={order.id} />
                <label className="block text-xs text-stone">
                  Amount (GHS)
                  <input
                    name="amountGhs"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={(refundable / 100).toFixed(2)}
                    defaultValue={(refundable / 100).toFixed(2)}
                    required
                    className={inputClass}
                  />
                </label>
                <label className="block text-xs text-stone">
                  Reason
                  <input name="reason" required minLength={3} placeholder="e.g. Bottle arrived damaged" className={inputClass} />
                </label>
              </ActionForm>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
