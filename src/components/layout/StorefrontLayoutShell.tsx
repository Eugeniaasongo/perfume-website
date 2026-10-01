import React from "react";
import { UtilityBar } from "@/components/layout/UtilityBar";
import { Header } from "@/components/layout/Header";

export function StorefrontLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <UtilityBar />
      <Header cartCount={0} />
      <main className="flex-1">{children}</main>
      <footer className="bg-black text-white pt-12 pb-6 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <span className="text-xl font-extrabold tracking-[0.2em] text-brand-gold block mb-2">
              RYZ PARFUMS
            </span>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Ghanaian-owned luxury fragrance house. Crafted with high oil concentration for enduring elegance.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-4 text-brand-gold">
              Quick Links
            </h3>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li><a href="/collections/men" className="hover:text-brand-gold">Men&apos;s Collection</a></li>
              <li><a href="/collections/women" className="hover:text-brand-gold">Women&apos;s Collection</a></li>
              <li><a href="/collections/unisex" className="hover:text-brand-gold">Unisex Scents</a></li>
              <li><a href="/collections/ryz-parfums" className="hover:text-brand-gold">House Collection</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-4 text-brand-gold">
              Customer Care
            </h3>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li><a href="/tracking" className="hover:text-brand-gold">Track Your Order</a></li>
              <li><a href="/terms" className="hover:text-brand-gold">Terms & Conditions</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-4 text-brand-gold">
              Accepted Payments
            </h3>
            <p className="text-xs text-neutral-400 mb-2 font-semibold">
              • Cash on Delivery (Nationwide)
            </p>
            <p className="text-xs text-neutral-400">
              • MTN MoMo, Telecel Cash, AirtelTigo Money & Cards via Paystack
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-neutral-800 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} RYZ Parfums. All Rights Reserved. Ghanaian Craftsmanship.
        </div>
      </footer>
    </div>
  );
}
