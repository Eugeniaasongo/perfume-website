import React from "react";
import { UtilityBar } from "./UtilityBar";
import { Header } from "./Header";

export const StorefrontLayoutShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <UtilityBar />
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="bg-black text-white pt-12 pb-6 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 text-brand-gold text-lg font-bold mb-3">
              <span>👑</span> RYZ PARFUMS
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Ghanaian-owned luxury fragrance house. Crafted with premium oils, long-lasting formulation, and signature elegance.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-4">
              Fragrance Collections
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li><a href="/collections/men" className="hover:text-brand-gold">Men's Fragrances</a></li>
              <li><a href="/collections/women" className="hover:text-brand-gold">Women's Fragrances</a></li>
              <li><a href="/collections/unisex" className="hover:text-brand-gold">Unisex Niche Scents</a></li>
              <li><a href="/collections/ryz-parfums" className="hover:text-brand-gold">RYZ Parfums Signature</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-4">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li><a href="/tracking" className="hover:text-brand-gold">Track Order</a></li>
              <li><a href="/terms" className="hover:text-brand-gold">Shipping & Delivery</a></li>
              <li><a href="/terms" className="hover:text-brand-gold">Return Policy (Opened Fragrances)</a></li>
              <li><a href="/terms" className="hover:text-brand-gold">Cash on Delivery Terms</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-4">
              Legal & Compliance
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li><a href="/terms" className="hover:text-brand-gold">Terms of Service</a></li>
              <li><a href="/terms" className="hover:text-brand-gold">Privacy Policy (Act 843)</a></li>
              <li><a href="/admin" className="hover:text-brand-gold">Admin Portal</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 border-t border-neutral-800 pt-6 flex flex-col md:flex-row justify-between items-center text-[10px] text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} RYZ Parfums. All Rights Reserved.</p>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>Paystack Secured</span>
            <span>•</span>
            <span>Cash on Delivery Verified</span>
            <span>•</span>
            <span>Ghana Post GPS Supported</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
