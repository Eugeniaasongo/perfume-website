import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatGhs } from "@/lib/format";
import { SITE } from "@/lib/site";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Packing slip" };

export default async function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { variant: { include: { product: { select: { title: true } } } } } } },
  });
  if (!order) notFound();

  const isCod = order.paymentProvider === "CASH_ON_DELIVERY";
  const amountDue = isCod ? order.totalPrice : 0;

  return (
    <div className="mx-auto max-w-2xl bg-white p-8 text-sm text-ink print:p-0">
      <div className="mb-6 flex items-start justify-between print:hidden">
        <p className="text-stone">Print this slip and put it in the parcel.</p>
        <PrintButton />
      </div>

      <header className="flex items-start justify-between border-b border-ink pb-4">
        <div>
          <p className="font-display text-2xl tracking-[0.3em] text-brand-gold-dark">DHA</p>
          <p className="text-[10px] tracking-[0.4em]">PERFUMES</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{order.orderNumber}</p>
          <p className="text-stone">{order.createdAt.toLocaleDateString("en-GB", { dateStyle: "long" })}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 border-b border-line py-4">
        <div>
          <p className="text-xs uppercase tracking-label text-stone">Deliver to</p>
          <p className="mt-1 font-medium">{order.customerName}</p>
          <p>{order.customerPhone}</p>
          <p>{order.addressLine}</p>
          <p>
            {order.city}, {order.region}
          </p>
          {order.landmark && <p>Near {order.landmark}</p>}
          {order.ghanaPostGps && <p>GPS: {order.ghanaPostGps}</p>}
        </div>
        <div>
          <p className="text-xs uppercase tracking-label text-stone">Payment</p>
          <p className="mt-1 font-medium">{isCod ? "CASH ON DELIVERY" : "PAID ONLINE"}</p>
          <p className="mt-3 text-xs uppercase tracking-label text-stone">Collect from customer</p>
          <p className="text-2xl font-semibold">{amountDue > 0 ? formatGhs(amountDue) : "Nothing — prepaid"}</p>
          {order.riderName && <p className="mt-3 text-stone">Rider: {order.riderName}</p>}
        </div>
      </section>

      <table className="mt-4 w-full">
        <thead className="text-left text-xs uppercase tracking-label text-stone">
          <tr>
            <th className="py-2 font-normal">Item</th>
            <th className="py-2 font-normal">SKU</th>
            <th className="py-2 text-right font-normal">Qty</th>
            <th className="py-2 text-center font-normal">Packed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {order.items.map((item) => (
            <tr key={item.id}>
              <td className="py-2">
                {item.variant.product.title} · {item.variant.size}
              </td>
              <td className="py-2 text-stone">{item.variant.sku}</td>
              <td className="py-2 text-right font-medium">{item.quantity}</td>
              <td className="py-2 text-center">☐</td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="mt-10 border-t border-line pt-4 text-xs text-stone">
        Thank you for shopping with DHA Perfumes. Questions? WhatsApp +{SITE.whatsapp} · {SITE.email}
      </footer>
    </div>
  );
}
