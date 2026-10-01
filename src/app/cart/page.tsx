"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StorefrontLayoutShell } from "@/components/layout/StorefrontLayoutShell";
import { Trash2, ArrowRight, ShieldCheck, Tag } from "lucide-react";

interface CartItem {
  variantId: string;
  title: string;
  size: string;
  pricePesewas: number;
  quantity: number;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([
    {
      variantId: "RYZ-RO-100ML",
      title: "ROYAL OUD EXTRAIT",
      size: "100ml",
      pricePesewas: 29900,
      quantity: 1,
    },
  ]);

  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    pesewas: number;
  } | null>(null);

  const itemsPricePesewas = items.reduce(
    (sum, item) => sum + item.pricePesewas * item.quantity,
    0
  );

  const discountPesewas = appliedDiscount ? appliedDiscount.pesewas : 0;
  const subtotalAfterDiscount = Math.max(0, itemsPricePesewas - discountPesewas);

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (discountCode.trim().toUpperCase() === "WELCOME10") {
      const disc = Math.round(itemsPricePesewas * 0.1);
      setAppliedDiscount({ code: "WELCOME10", pesewas: disc });
    } else {
      alert("Invalid discount code. Try 'WELCOME10'!");
    }
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.variantId === variantId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  return (
    <StorefrontLayoutShell>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-2 block">
            Your Selection
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-wider text-black">
            Shopping Bag
          </h1>
          <div className="w-16 h-0.5 bg-brand-gold mx-auto mt-3" />
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 border border-neutral-200 bg-neutral-50 p-8 space-y-4">
            <p className="text-lg font-bold text-black uppercase tracking-wider">
              Your bag is currently empty
            </p>
            <p className="text-xs text-neutral-500">
              Explore our luxury long-lasting fragrances and add your signature scent.
            </p>
            <Link
              href="/collections/ryz-parfums"
              className="inline-block bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-black transition-colors"
            >
              Explore Collections
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="border border-neutral-200 bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-16 bg-neutral-900 border border-brand-gold flex items-center justify-center p-1 text-center">
                      <span className="text-[8px] font-bold text-brand-gold uppercase">
                        RYZ
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-black">
                        {item.title}
                      </h3>
                      <span className="text-xs text-neutral-500 font-medium">
                        Volume: {item.size}
                      </span>
                      <span className="text-xs font-bold text-black block mt-1">
                        GHS {(item.pricePesewas / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex border border-neutral-300">
                      <button
                        onClick={() => updateQuantity(item.variantId, -1)}
                        className="px-2.5 py-1 text-xs font-bold hover:bg-neutral-100"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-bold flex items-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, 1)}
                        className="px-2.5 py-1 text-xs font-bold hover:bg-neutral-100"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-sm font-extrabold text-black">
                      GHS {((item.pricePesewas * item.quantity) / 100).toFixed(2)}
                    </span>

                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="text-neutral-400 hover:text-brand-red p-1 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-neutral-200 bg-neutral-50 p-6 space-y-6">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-black border-b border-neutral-200 pb-2">
                Order Summary
              </h2>

              <form onSubmit={handleApplyDiscount} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Discount code (e.g. WELCOME10)"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1 text-xs py-2 px-3 border border-neutral-300 bg-white uppercase tracking-wider focus:outline-none focus:border-black"
                />
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-black transition-colors"
                >
                  Apply
                </button>
              </form>

              {appliedDiscount && (
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 p-2 border border-emerald-200">
                  <span className="flex items-center gap-1">
                    <Tag size={12} /> {appliedDiscount.code} (-10%)
                  </span>
                  <span>- GHS {(appliedDiscount.pesewas / 100).toFixed(2)}</span>
                </div>
              )}

              <div className="space-y-2 text-xs border-t border-neutral-200 pt-4">
                <div className="flex justify-between text-neutral-600 font-medium">
                  <span>Bag Subtotal</span>
                  <span>GHS {(itemsPricePesewas / 100).toFixed(2)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount</span>
                    <span>- GHS {(discountPesewas / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-black pt-2 border-t border-neutral-200">
                  <span>Subtotal</span>
                  <span>GHS {(subtotalAfterDiscount / 100).toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-neutral-500 font-light">
                  Shipping and region-based fees calculated at checkout.
                </p>
              </div>

              <div className="bg-white border border-brand-gold/40 p-3 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-brand-gold-dark uppercase tracking-wider">
                  <ShieldCheck size={16} className="text-brand-gold" />
                  <span>CASH ON DELIVERY ACCEPTED</span>
                </div>
                <p className="text-[10px] text-neutral-600 font-medium">
                  Pay with Cash or Mobile Money upon delivery anywhere in Ghana.
                </p>
              </div>

              <Link
                href="/terms"
                className="w-full bg-black text-white py-3.5 px-6 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-gold hover:text-black transition-all shadow-lg"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayoutShell>
  );
}
