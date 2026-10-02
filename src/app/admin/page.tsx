import React from "react";
import { prisma } from "@/lib/prisma";
import { Crown, Package, ShoppingBag, ShieldCheck, Tag } from "lucide-react";

export default async function AdminDashboardPage() {
  const productsCount = await prisma.product.count();
  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const totalRevenuePesewas = recentOrders.reduce(
    (sum, order) => (order.status === "PAID" || order.status === "DELIVERED" ? sum + order.totalPrice : sum),
    0
  );

  const globalConfig = await prisma.inspiredByConfig.findUnique({
    where: { id: "global" },
  });

  return (
    <div className="min-h-screen bg-neutral-100 text-black p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-black text-white p-6 border-b-4 border-brand-gold flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Crown size={28} className="text-brand-gold" />
            <div>
              <h1 className="text-xl font-extrabold tracking-widest uppercase">
                RYZ Parfums Admin Portal
              </h1>
              <span className="text-xs text-neutral-400 font-medium">
                Storefront Operations & COD Reconciliation
              </span>
            </div>
          </div>
          <div className="bg-neutral-900 border border-brand-gold/40 px-3 py-1.5 text-xs font-bold text-brand-gold uppercase tracking-wider">
            Role: Owner / Staff (MFA Verified)
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            <Tag size={18} className="text-brand-red" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-black">
              Dynamic Inspired-By Catalog Control (No Redeploy Required)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-2">
              <span className="font-bold block uppercase text-neutral-800">
                Global Display Toggle
              </span>
              <p className="text-neutral-500 text-[11px]">
                Currently:{" "}
                <strong className={globalConfig?.globalEnabled ? "text-emerald-700" : "text-brand-red"}>
                  {globalConfig?.globalEnabled ? "ENABLED" : "DISABLED"}
                </strong>
              </p>
              <button className="bg-black text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-black transition-colors">
                Toggle Global Status
              </button>
            </div>

            <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-2">
              <span className="font-bold block uppercase text-neutral-800">
                Badge Label Override
              </span>
              <p className="text-neutral-500 text-[11px]">
                Active Label: <strong>{globalConfig?.labelOverride || "INSPIRED BY"}</strong>
              </p>
              <button className="bg-black text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-black transition-colors">
                Update Label
              </button>
            </div>

            <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-2">
              <span className="font-bold block uppercase text-neutral-800">
                Inspiration Bottle Images
              </span>
              <p className="text-neutral-500 text-[11px]">
                Currently: <strong>{globalConfig?.showImages ? "VISIBLE" : "HIDDEN"}</strong>
              </p>
              <button className="bg-black text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-black transition-colors">
                Toggle Images
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-neutral-200 p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block">
                Total Products
              </span>
              <span className="text-3xl font-extrabold text-black">{productsCount}</span>
            </div>
            <Package size={32} className="text-brand-gold" />
          </div>

          <div className="bg-white border border-neutral-200 p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block">
                Recent Orders
              </span>
              <span className="text-3xl font-extrabold text-black">{recentOrders.length}</span>
            </div>
            <ShoppingBag size={32} className="text-brand-gold" />
          </div>

          <div className="bg-white border border-neutral-200 p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block">
                Tracked Revenue
              </span>
              <span className="text-3xl font-extrabold text-black">
                GHS {(totalRevenuePesewas / 100).toFixed(2)}
              </span>
            </div>
            <ShieldCheck size={32} className="text-brand-gold" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-black border-b border-neutral-200 pb-2">
            Recent Orders & COD Reconciliation
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 font-extrabold uppercase tracking-wider">
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-bold text-black">{ord.orderNumber}</td>
                    <td className="p-3">{ord.customerName} ({ord.customerPhone})</td>
                    <td className="p-3 font-semibold uppercase">{ord.paymentProvider}</td>
                    <td className="p-3 font-extrabold text-black">
                      GHS {(ord.totalPrice / 100).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span className="bg-black text-brand-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button className="bg-neutral-900 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-black">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
