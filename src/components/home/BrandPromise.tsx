import React from "react";
import { Sparkles, ShieldCheck, Truck } from "lucide-react";

export function BrandPromise() {
  return (
    <section className="bg-white text-black py-12 px-4 border-b border-neutral-200">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <span className="text-brand-gold text-xs uppercase tracking-[0.3em] font-semibold block">
          Crafted with Precision in Ghana
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-wider uppercase">
          Long-Lasting Luxury Fragrances Without The Massive Price Tag
        </h2>
        <p className="text-neutral-700 text-sm md:text-base leading-relaxed font-light max-w-3xl mx-auto">
          At RYZ Parfums, we formulate high-concentration Extraits de Parfum inspired by your favorite designer and niche scents. Enjoy intense projection, multilayered notes, and 24-hour longevity crafted to leave an undeniable impression—delivered right to your door with trusted Cash on Delivery nationwide.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-neutral-100 text-xs font-bold tracking-wider uppercase text-neutral-800">
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={18} className="text-brand-gold" />
            <span>High Oil Concentration</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck size={18} className="text-brand-gold" />
            <span>Cash on Delivery</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Truck size={18} className="text-brand-gold" />
            <span>Fast Nationwide Shipping</span>
          </div>
        </div>
      </div>
    </section>
  );
}
