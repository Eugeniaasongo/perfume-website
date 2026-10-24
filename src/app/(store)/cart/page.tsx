"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { BottleArt } from "@/components/ui/BottleArt";
import { MAX_QUANTITY_PER_LINE, updateCartQuantity, useCart, useIsHydrated } from "@/lib/cart";
import { formatGhs } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD_PESEWAS } from "@/lib/shipping";

export default function CartPage() {
  const items = useCart();
  const hydrated = useIsHydrated();

  if (!hydrated) {
    return <div className="container-page min-h-[50vh] py-16" aria-busy="true" />;
  }

  const subtotal = items.reduce((sum, item) => sum + item.pricePesewas * item.quantity, 0);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_PESEWAS - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD_PESEWAS) * 100);

  return (
    <div className="container-page py-12 lg:py-16">
      <h1 className="heading-display text-5xl">Your bag</h1>

      {items.length === 0 ? (
        <div className="mt-10 border border-dashed border-line py-20 text-center">
          <ShoppingBag size={36} strokeWidth={1} className="mx-auto text-stone-light" />
          <p className="mt-4 font-display text-2xl text-ink">Your bag is empty</p>
          <p className="mt-2 text-sm text-stone">Discover a scent that lasts all day.</p>
          <Link href="/collections/all" className="btn-primary mt-8">
            Shop fragrances
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
          <ul className="divide-y divide-line border-y border-line">
            {items.map((item) => (
              <li key={item.variantId} className="flex gap-4 py-6 sm:gap-6">
                <Link href={`/products/${item.slug}`} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-sand sm:w-28">
                  <BottleArt title={item.productName} slug={item.slug} category="" imageUrl={item.imageUrl} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/products/${item.slug}`} className="font-display text-xl leading-tight text-ink hover:text-brand-gold-dark">
                        {item.productName}
                      </Link>
                      <p className="mt-1 text-xs text-stone">{item.size}</p>
                    </div>
                    <button
                      onClick={() => updateCartQuantity(item.variantId, 0)}
                      className="-mr-2 -mt-1 p-2 text-stone hover:text-ink"
                      aria-label={`Remove ${item.productName} ${item.size}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <div className="flex items-center border border-line bg-white">
                      <button
                        onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                        className="flex h-9 w-9 items-center justify-center hover:bg-sand"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= MAX_QUANTITY_PER_LINE}
                        className="flex h-9 w-9 items-center justify-center hover:bg-sand disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="text-sm text-ink">{formatGhs(item.pricePesewas * item.quantity)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit space-y-6 bg-white p-6 lg:sticky lg:top-24">
            <div>
              <p className="text-sm text-ink">
                {remaining > 0 ? (
                  <>You&apos;re {formatGhs(remaining)} away from free delivery</>
                ) : (
                  <>You&apos;ve unlocked free delivery</>
                )}
              </p>
              <div className="mt-2 h-1 bg-line">
                <div className="h-full bg-brand-gold transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <dl className="space-y-3 border-t border-line pt-6 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone">Subtotal</dt>
                <dd className="text-ink">{formatGhs(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone">Delivery</dt>
                <dd className="text-stone">Calculated at checkout</dd>
              </div>
            </dl>

            <Link href="/checkout" className="btn-primary w-full">
              Checkout <ArrowRight size={14} />
            </Link>
            <p className="text-center text-xs text-stone">Pay online or with cash on delivery</p>
          </aside>
        </div>
      )}
    </div>
  );
}
