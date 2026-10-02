"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { StorefrontLayoutShell } from "@/components/layout/StorefrontLayoutShell";
import { Trash2, ShieldCheck, ArrowRight, ShoppingBag } from "lucide-react";
import { getCart, updateCartQuantity, CartItem } from "@/lib/cart";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(getCart());

    const handleUpdate = () => setItems(getCart());
    window.addEventListener("cart_updated", handleUpdate);
    return () => window.removeEventListener("cart_updated", handleUpdate);
  }, []);

  if (!mounted) return null;

  const subtotalPesewas = items.reduce((sum, item) => sum + item.pricePesewas * item.quantity, 0);

  return (
    <StorefrontLayoutShell>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-2 block">
            Your Selection
          </span>
          <h1 className="text-3xl font-extrabold uppercase tracking-wider text-black">
            Shopping Cart
          </h1>
          <div className="w-16 h-0.5 bg-brand-gold mx-auto mt-3" />
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-200">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-sm font-semibold uppercase tracking-wider text-neutral-600 mb-6">
              Your cart is currently empty
            </p>
            <Link
              href="/collections/ryz-parfums"
              className="inline-block bg-black text-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-black transition-colors"
            >
              Explore Collections
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-4 border border-neutral-200 p-4 items-center bg-white"
                >
                  <div className="relative w-20 h-20 bg-neutral-50 flex-shrink-0 border border-neutral-100">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-black truncate">
                      {item.productName}
                    </h3>
                    <p className="text-[11px] text-neutral-500 uppercase mt-0.5">
                      Size: {item.size}
                    </p>
                    <p className="text-xs font-extrabold text-black mt-2">
                      GHS {(item.pricePesewas / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-neutral-300">
                      <button
                        onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                        className="px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-bold text-black">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                        className="px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => updateCartQuantity(item.variantId, 0)}
                      className="text-neutral-400 hover:text-brand-alert-red transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="border border-neutral-200 p-6 bg-neutral-50 h-fit space-y-6">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-black border-b border-neutral-200 pb-3">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-black">
                    GHS {(subtotalPesewas / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Estimated Shipping</span>
                  <span>Calculated at Checkout</span>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 flex justify-between text-sm font-extrabold text-black">
                <span>Total</span>
                <span>GHS {(subtotalPesewas / 100).toFixed(2)}</span>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/checkout"
                  className="w-full bg-black text-white py-3.5 px-4 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-black transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={14} />
                </Link>

                <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-brand-gold-dark uppercase pt-2">
                  <ShieldCheck size={14} className="text-brand-gold" />
                  <span>CASH ON DELIVERY ACCEPTED</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayoutShell>
  );
}
