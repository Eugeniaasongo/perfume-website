"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus, ShieldCheck, Truck, MessageCircle } from "lucide-react";
import { BottleArt } from "@/components/ui/BottleArt";
import { showToast } from "@/components/ui/Toaster";
import { addToCart, MAX_QUANTITY_PER_LINE } from "@/lib/cart";
import { formatGhs } from "@/lib/format";
import { whatsappLink } from "@/lib/site";
import type { ProductDetail } from "@/lib/services/catalog";

const LONGEVITY = ["", "2–4 hours", "4–6 hours", "6–8 hours", "8–12 hours", "12+ hours"];
const SILLAGE = ["", "Intimate", "Soft", "Moderate", "Strong", "Room-filling"];

function Meter({ label, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs">
        <span className="uppercase tracking-label text-ink">{label}</span>
        <span className="text-stone">{caption}</span>
      </div>
      <div className="grid grid-cols-5 gap-1" aria-label={`${label}: ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`h-1 ${n <= value ? "bg-brand-gold" : "bg-line"}`} />
        ))}
      </div>
    </div>
  );
}

export function ProductDetailView({ product }: { product: ProductDetail }) {
  const firstInStock = Math.max(0, product.variants.findIndex((v) => v.stock > 0));
  const [variantIndex, setVariantIndex] = useState(firstInStock);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = product.variants[variantIndex];
  const isOutOfStock = !variant || variant.stock <= 0;
  const maxQty = variant ? Math.min(MAX_QUANTITY_PER_LINE, variant.stock) : 1;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      productName: product.title,
      size: variant.size,
      pricePesewas: variant.pricePesewas,
      imageUrl: product.imageUrl,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    showToast({
      title: "Added to your bag",
      description: `${product.title} · ${variant.size} × ${quantity}`,
      href: "/cart",
      hrefLabel: "View bag",
    });
  };

  return (
    <div className="container-page py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-stone">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/collections/${product.category.toLowerCase()}`} className="hover:text-ink">
          {product.category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="relative aspect-square overflow-hidden bg-sand lg:sticky lg:top-24 lg:aspect-[4/5] lg:self-start">
          <BottleArt
            title={product.title}
            slug={product.slug}
            category={product.category}
            concentration={product.concentration}
            imageUrl={product.imageUrl}
            size="lg"
            priority
          />
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            {product.inspiredBy && (
              <p className="text-xs">
                <span className="inspired-label">{product.inspiredBy.label}</span>{" "}
                <span className="uppercase tracking-wide text-ink">
                  {product.inspiredBy.house} — {product.inspiredBy.name}
                </span>
              </p>
            )}
            <h1 className="heading-display text-4xl sm:text-5xl">{product.title}</h1>
            <p className="text-sm text-stone">{product.concentration}</p>
            <p className="pt-1 text-2xl text-ink">
              {variant ? formatGhs(variant.pricePesewas) : "—"}
              {variant?.comparePricePesewas && variant.comparePricePesewas > variant.pricePesewas && (
                <span className="ml-3 text-base text-stone-light line-through">
                  {formatGhs(variant.comparePricePesewas)}
                </span>
              )}
            </p>
          </div>

          <p className="max-w-prose text-[15px] leading-relaxed text-stone">{product.description}</p>

          <fieldset>
            <legend className="mb-3 text-xs uppercase tracking-label text-ink">Size</legend>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v, idx) => {
                const soldOut = v.stock <= 0;
                const selected = idx === variantIndex;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVariantIndex(idx);
                      setQuantity(1);
                    }}
                    aria-pressed={selected}
                    className={`min-w-[88px] border px-4 py-3 text-left transition-colors ${
                      selected ? "border-ink bg-ink text-ivory" : "border-line bg-white hover:border-ink"
                    } ${soldOut ? "opacity-50" : ""}`}
                  >
                    <span className="block text-sm">{v.size}</span>
                    <span className={`block text-[11px] ${selected ? "text-ivory/70" : "text-stone"}`}>
                      {soldOut ? "Sold out" : formatGhs(v.pricePesewas)}
                    </span>
                  </button>
                );
              })}
            </div>
            {variant && variant.stock > 0 && variant.stock <= 5 && (
              <p className="mt-3 text-xs text-brand-gold-dark">Only {variant.stock} left in this size</p>
            )}
          </fieldset>

          <div className="flex gap-3">
            <div className="flex items-center border border-line bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-full w-11 items-center justify-center hover:bg-sand disabled:opacity-30"
                disabled={quantity <= 1 || isOutOfStock}
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm" aria-live="polite">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                className="flex h-full w-11 items-center justify-center hover:bg-sand disabled:opacity-30"
                disabled={quantity >= maxQty || isOutOfStock}
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
            <button onClick={handleAddToCart} disabled={isOutOfStock} className="btn-primary flex-1">
              {added ? (
                <>
                  <Check size={16} /> Added
                </>
              ) : isOutOfStock ? (
                "Sold out"
              ) : (
                `Add to bag · ${formatGhs(variant.pricePesewas * quantity)}`
              )}
            </button>
          </div>

          <ul className="grid gap-3 border-y border-line py-5 text-sm text-ink sm:grid-cols-2">
            <li className="flex items-center gap-3">
              <ShieldCheck size={18} strokeWidth={1.5} className="text-brand-gold-dark" />
              Pay cash or MoMo on delivery
            </li>
            <li className="flex items-center gap-3">
              <Truck size={18} strokeWidth={1.5} className="text-brand-gold-dark" />
              Delivery across all 16 regions
            </li>
          </ul>

          <section aria-labelledby="notes-heading" className="space-y-4">
            <h2 id="notes-heading" className="text-xs uppercase tracking-label text-ink">
              Fragrance notes
            </h2>
            <dl className="divide-y divide-line border-y border-line">
              {[
                ["Top", product.topNotes],
                ["Heart", product.heartNotes],
                ["Base", product.baseNotes],
              ].map(([label, notes]) => (
                <div key={label as string} className="grid grid-cols-[80px_1fr] gap-4 py-3 text-sm">
                  <dt className="text-stone">{label as string}</dt>
                  <dd className="text-ink">{(notes as string[]).join(" · ") || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-label="Performance" className="grid gap-5 sm:grid-cols-2">
            <Meter label="Longevity" value={product.longevityRating} caption={LONGEVITY[product.longevityRating] ?? ""} />
            <Meter label="Projection" value={product.sillageRating} caption={SILLAGE[product.sillageRating] ?? ""} />
          </section>

          <a
            href={whatsappLink(`Hello RYZ Parfums, I have a question about ${product.title} (${variant?.size ?? ""}).`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-ink underline-offset-4 hover:underline"
          >
            <MessageCircle size={16} strokeWidth={1.5} />
            Questions about this scent? Ask us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
