import React from "react";
import { StorefrontLayoutShell } from "@/components/layout/StorefrontLayoutShell";
import { prisma } from "@/lib/prisma";
import { Package, Truck, CheckCircle2, AlertCircle } from "lucide-react";

interface TrackingPageProps {
  searchParams: Promise<{ orderNumber?: string }>;
}

export default async function OrderTrackingPage({ searchParams }: TrackingPageProps) {
  const { orderNumber } = await searchParams;

  const order = orderNumber
    ? await prisma.order.findUnique({
        where: { orderNumber: orderNumber.trim().toUpperCase() },
        include: { items: { include: { variant: { include: { product: true } } } } },
      })
    : null;

  return (
    <StorefrontLayoutShell>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-2 block">
            Real-Time Updates
          </span>
          <h1 className="text-3xl font-extrabold uppercase tracking-wider text-black">
            Track Your Order
          </h1>
          <div className="w-16 h-0.5 bg-brand-gold mx-auto mt-3" />
        </div>

        <form className="max-w-md mx-auto mb-10 flex gap-2">
          <input
            type="text"
            name="orderNumber"
            defaultValue={orderNumber || ""}
            placeholder="Enter Order Number (e.g. RYZ-1001)"
            className="flex-1 border border-neutral-300 p-3 text-xs uppercase tracking-wider focus:outline-none focus:border-black bg-white"
          />
          <button
            type="submit"
            className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-black transition-colors"
          >
            Track
          </button>
        </form>

        {orderNumber && !order && (
          <div className="bg-neutral-50 border border-neutral-200 p-6 text-center text-xs text-neutral-600 font-medium">
            <AlertCircle size={24} className="text-brand-red mx-auto mb-2" />
            No order found with number &quot;{orderNumber}&quot;. Please check your receipt.
          </div>
        )}

        {order && (
          <div className="border border-neutral-200 bg-white p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between border-b border-neutral-200 pb-4 gap-2">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-black">
                  Order #{order.orderNumber}
                </h2>
                <span className="text-xs text-neutral-500 font-medium">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="inline-block bg-black text-brand-gold text-xs font-extrabold uppercase tracking-widest px-3 py-1">
                  Status: {order.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-700">
              <div className="border-t-2 border-brand-gold pt-2 flex flex-col items-center">
                <CheckCircle2 size={16} className="text-brand-gold mb-1" />
                <span>Order Placed</span>
              </div>
              <div className="border-t-2 border-brand-gold pt-2 flex flex-col items-center">
                <Package size={16} className="text-brand-gold mb-1" />
                <span>Confirmed</span>
              </div>
              <div className="border-t-2 border-neutral-300 pt-2 flex flex-col items-center opacity-50">
                <Truck size={16} className="mb-1" />
                <span>Out for Delivery</span>
              </div>
              <div className="border-t-2 border-neutral-300 pt-2 flex flex-col items-center opacity-50">
                <CheckCircle2 size={16} className="mb-1" />
                <span>Delivered</span>
              </div>
            </div>

            <div className="bg-neutral-50 p-4 border border-neutral-200 text-xs space-y-1">
              <h3 className="font-extrabold uppercase tracking-widest text-black mb-1">
                Delivery Destination
              </h3>
              <p className="text-neutral-800 font-bold">{order.customerName}</p>
              <p className="text-neutral-600">{order.addressLine}, {order.city}, {order.region}</p>
              <p className="text-neutral-600">Phone: {order.customerPhone}</p>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayoutShell>
  );
}
