import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { normalizeGhanaPhone } from "@/lib/phone";
import { formatGhs } from "@/lib/format";
import { whatsappLink } from "@/lib/site";
import { ORDER_STATE_LABELS, type OrderState } from "@/lib/orders/state-machine";
import { confirmPaystackPayment } from "@/lib/payments/paystack";
import { CompletePaymentButton } from "./CompletePaymentButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false } };

interface OrderPageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ phone?: string; reference?: string; trxref?: string }>;
}

const STEPS = ["Order placed", "Confirmed", "Out for delivery", "Delivered"];

function stepFor(status: OrderState): number {
  switch (status) {
    case "PENDING_PAYMENT":
    case "AWAITING_DELIVERY_PAYMENT":
      return 0;
    case "PAID":
    case "CONFIRMED":
    case "PROCESSING":
      return 1;
    case "SHIPPED":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return -1;
  }
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { orderNumber } = await params;
  const { phone, reference, trxref } = await searchParams;
  const normalizedPhone = phone ? normalizeGhanaPhone(phone) : null;

  const loadOrder = () =>
    prisma.order.findUnique({
      where: { orderNumber: decodeURIComponent(orderNumber).toUpperCase() },
      include: { items: { include: { variant: { include: { product: { select: { title: true, slug: true } } } } } } },
    });

  let order = normalizedPhone ? await loadOrder() : null;

  // Back from Paystack: confirm the payment directly instead of waiting for the webhook.
  const paymentReference = reference || trxref;
  if (order && order.customerPhone === normalizedPhone && order.status === "PENDING_PAYMENT" && paymentReference) {
    try {
      await confirmPaystackPayment(order.id, paymentReference);
      order = await loadOrder();
    } catch (error) {
      console.error(`Payment confirmation failed for ${orderNumber}:`, error);
    }
  }

  // Same response for "wrong phone" and "no such order" so order numbers can't be enumerated.
  if (!order || order.customerPhone !== normalizedPhone) {
    return (
      <div className="container-page max-w-lg py-24 text-center">
        <h1 className="heading-display text-4xl">We couldn&apos;t find that order</h1>
        <p className="mt-4 text-sm text-stone">
          Check the order number and use the same phone number you ordered with.
        </p>
        <Link href={`/tracking?orderNumber=${encodeURIComponent(orderNumber)}`} className="btn-primary mt-8">
          Try again
        </Link>
      </div>
    );
  }

  const status = order.status as OrderState;
  const step = stepFor(status);
  const awaitingPayment = status === "PENDING_PAYMENT";

  return (
    <div className="container-page max-w-3xl py-12 lg:py-16">
      <div className="text-center">
        <CheckCircle2 size={40} strokeWidth={1} className="mx-auto text-brand-gold-dark" />
        <p className="eyebrow mt-4">Order {order.orderNumber}</p>
        <h1 className="heading-display mt-3 text-4xl sm:text-5xl">
          {awaitingPayment ? "Almost there" : `Thank you, ${order.customerName.split(" ")[0]}`}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-stone">
          {awaitingPayment
            ? "Your order is reserved but not paid yet. If you've just paid, refresh in a few seconds; otherwise complete your payment below."
            : order.paymentProvider === "CASH_ON_DELIVERY"
              ? `Please have ${formatGhs(order.totalPrice)} ready in cash or MoMo when your order arrives.`
              : "Your payment was received. We'll text you when your order is on its way."}
        </p>
        {awaitingPayment && <CompletePaymentButton orderNumber={order.orderNumber} phone={order.customerPhone} />}
      </div>

      <section className="mt-12 bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-label text-ink">Status</h2>
          <span className="bg-sand px-3 py-1 text-xs text-ink">{ORDER_STATE_LABELS[status] ?? status}</span>
        </div>

        {step >= 0 ? (
          <ol className="mt-8 grid grid-cols-4 gap-2">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-col items-center text-center">
                <span className="relative flex w-full items-center justify-center">
                  {i > 0 && <span className={`absolute right-1/2 top-1/2 h-px w-full ${i <= step ? "bg-brand-gold" : "bg-line"}`} />}
                  <span className="relative bg-white px-1">
                    {i < step || step === 3 ? (
                      <CheckCircle2 size={20} className="text-brand-gold-dark" />
                    ) : i === step ? (
                      <Clock size={20} className="text-brand-gold-dark" />
                    ) : (
                      <Circle size={20} className="text-line" />
                    )}
                  </span>
                </span>
                <span className={`mt-2 text-[11px] sm:text-xs ${i <= step ? "text-ink" : "text-stone-light"}`}>{label}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {status === "SHIPPED" && order.riderName && (
          <p className="mt-6 border-t border-line pt-4 text-sm text-ink">
            Your rider is <strong className="font-medium">{order.riderName}</strong>
            {order.riderPhone && (
              <>
                {" "}
                —{" "}
                <a href={`tel:${order.riderPhone}`} className="underline underline-offset-2">
                  {order.riderPhone}
                </a>
              </>
            )}
            .
          </p>
        )}

        {step < 0 && !["CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(status) ? (
          <p className="mt-6 text-sm text-stone">
            This order needs attention. Our team will contact you, or you can reach us on WhatsApp.
          </p>
        ) : step < 0 ? (
          <p className="mt-6 text-sm text-stone">
            {status === "CANCELLED"
              ? "This order was cancelled. If you were charged, your refund will follow."
              : "A refund has been issued for this order."}
          </p>
        ) : null}
      </section>

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="bg-white p-6 sm:p-8">
          <h2 className="text-xs uppercase tracking-label text-ink">Items</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  <Link href={`/products/${item.variant.product.slug}`} className="text-ink hover:text-brand-gold-dark">
                    {item.variant.product.title}
                  </Link>
                  <span className="block text-xs text-stone">
                    {item.variant.size} × {item.quantity}
                  </span>
                </span>
                <span>{formatGhs(item.totalPesewas)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone">Subtotal</dt>
              <dd>{formatGhs(order.itemsPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone">Delivery</dt>
              <dd>{order.shippingPrice === 0 ? "Free" : formatGhs(order.shippingPrice)}</dd>
            </div>
            {order.discountPrice > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Discount</dt>
                <dd>−{formatGhs(order.discountPrice)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-2 font-medium">
              <dt>Total</dt>
              <dd>{formatGhs(order.totalPrice)}</dd>
            </div>
            {order.refundedAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Refunded</dt>
                <dd>{formatGhs(order.refundedAmount)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white p-6 sm:p-8">
          <h2 className="text-xs uppercase tracking-label text-ink">Delivering to</h2>
          <address className="mt-4 space-y-1 text-sm not-italic text-stone">
            <p className="text-ink">{order.customerName}</p>
            <p>{order.addressLine}</p>
            <p>
              {order.city}, {order.region}
            </p>
            {order.landmark && <p>Near {order.landmark}</p>}
          </address>
          <h2 className="mt-8 text-xs uppercase tracking-label text-ink">Payment</h2>
          <p className="mt-2 text-sm text-stone">
            {order.paymentProvider === "CASH_ON_DELIVERY" ? "Cash on Delivery" : "Paid online via Paystack"}
          </p>
          <a
            href={whatsappLink(`Hi RYZ Parfums, I have a question about order ${order.orderNumber}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm text-ink underline-offset-4 hover:underline"
          >
            <MessageCircle size={16} strokeWidth={1.5} /> Need help? WhatsApp us
          </a>
        </div>
      </section>

      <div className="mt-10 text-center">
        <Link href="/collections/all" className="btn-outline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
