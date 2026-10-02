"use client";

import React, { useState } from "react";
import { Star, ShieldCheck, Truck, ShoppingBag, Heart, MessageSquare, Check } from "lucide-react";

export interface PDPProps {
  product: {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    concentration: string;
    topNotes: string[];
    heartNotes: string[];
    baseNotes: string[];
    longevityRating: number;
    sillageRating: number;
    inspiredBy?: {
      house: string;
      name: string;
      labelOverride?: string;
    };
    variants: Array<{
      id: string;
      sku: string;
      size: string;
      pricePesewas: number;
      stock: number;
    }>;
  };
}

export function ProductDetailView({ product }: PDPProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const currentVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    product.variants[0];

  const priceGhs = currentVariant
    ? (currentVariant.pricePesewas / 100).toFixed(2)
    : "299.00";
  const inStock = currentVariant ? currentVariant.stock > 0 : false;

  const handleAddToCart = () => {
    alert(
      `Added ${quantity} x ${product.title} (${currentVariant?.size}) to your bag!`
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="bg-neutral-50 p-6 border border-neutral-200">
          <div className="grid grid-cols-3 gap-4 items-center min-h-[380px] bg-white p-6 border border-neutral-100 shadow-sm">
            <div className="col-span-2 flex flex-col items-center justify-center border-r border-neutral-200 pr-4">
              <div className="w-36 h-56 border-4 border-brand-gold bg-gradient-to-b from-neutral-950 via-stone-900 to-black p-4 flex flex-col justify-between items-center shadow-xl">
                <div className="w-8 h-6 bg-brand-gold rounded-t-sm" />
                <div className="text-center">
                  <span className="text-[10px] text-brand-gold font-bold tracking-widest block uppercase">
                    RYZ PARFUMS
                  </span>
                  <span className="text-sm text-white font-extrabold tracking-wider line-clamp-2 uppercase mt-1">
                    {product.title}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-brand-gold-light tracking-widest uppercase block">
                    {product.concentration}
                  </span>
                  <span className="text-[9px] text-neutral-400 tracking-widest uppercase block">
                    {currentVariant?.size || "100ml"}
                  </span>
                </div>
              </div>
            </div>

            <div className="col-span-1 flex flex-col items-center justify-center pl-2 text-center">
              <div className="w-16 h-24 border border-neutral-300 bg-neutral-100 flex items-center justify-center p-2 mb-2 shadow-inner">
                <span className="text-xs font-bold text-neutral-700 uppercase">
                  {product.inspiredBy?.house
                    ? product.inspiredBy.house.substring(0, 3)
                    : "LUX"}
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase line-clamp-2">
                {product.inspiredBy?.name || "Original Scent"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {product.inspiredBy && (
            <div className="inline-block bg-brand-red/10 border border-brand-red/30 px-3 py-1">
              <span className="text-xs font-extrabold tracking-widest text-brand-red uppercase block">
                {product.inspiredBy.labelOverride || "INSPIRED BY"}
              </span>
              <span className="text-sm font-bold text-black uppercase tracking-wider">
                {product.inspiredBy.house} - {product.inspiredBy.name}
              </span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-black">
                {product.title}
              </h1>
              <span className="bg-black text-brand-gold text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                {product.concentration}
              </span>
            </div>
            <p className="text-neutral-600 text-sm font-light leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="border-y border-neutral-200 py-4 flex items-center justify-between">
            <div>
              <span className="text-2xl font-extrabold text-black">
                GHS {priceGhs}
              </span>
              <div className="w-16 h-0.5 bg-brand-gold mt-1" />
            </div>
            <div>
              {inStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-700 bg-emerald-50 px-3 py-1 border border-emerald-200">
                  <Check size={14} /> In Stock ({currentVariant.stock} available)
                </span>
              ) : (
                <span className="font-script italic text-sm text-neutral-500">
                  Out of stock
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-black mb-2">
              Select Volume Size
            </label>
            <div className="flex gap-3">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${
                    selectedVariantId === v.id
                      ? "border-black bg-black text-white shadow-md"
                      : "border-neutral-300 text-black hover:border-black"
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-black border-b border-neutral-200 pb-1">
              Performance Ratings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-semibold text-neutral-600 uppercase block mb-1">
                  Longevity (24h+)
                </span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < product.longevityRating
                          ? "fill-brand-gold text-brand-gold"
                          : "text-neutral-300"
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-600 uppercase block mb-1">
                  Sillage & Projection
                </span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < product.sillageRating
                          ? "fill-brand-gold text-brand-gold"
                          : "text-neutral-300"
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border border-neutral-200 p-4 space-y-2 text-xs">
            <h3 className="font-extrabold uppercase tracking-widest text-black border-b border-neutral-200 pb-1">
              Fragrance Notes Pyramid
            </h3>
            <p>
              <strong className="text-neutral-900 uppercase">Top Notes:</strong>{" "}
              <span className="text-neutral-600">{product.topNotes.join(", ")}</span>
            </p>
            <p>
              <strong className="text-neutral-900 uppercase">Heart Notes:</strong>{" "}
              <span className="text-neutral-600">{product.heartNotes.join(", ")}</span>
            </p>
            <p>
              <strong className="text-neutral-900 uppercase">Base Notes:</strong>{" "}
              <span className="text-neutral-600">{product.baseNotes.join(", ")}</span>
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <div className="flex border border-neutral-300 bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-xs font-bold hover:bg-neutral-100"
                >
                  -
                </button>
                <span className="px-4 py-2 text-xs font-bold flex items-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-xs font-bold hover:bg-neutral-100"
                >
                  +
                </button>
              </div>

              <button
                disabled={!inStock}
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-6 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  inStock
                    ? "bg-black text-white hover:bg-brand-gold hover:text-black shadow-lg"
                    : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                }`}
              >
                <ShoppingBag size={16} />
                <span>{inStock ? "Add to Shopping Bag" : "Sold Out"}</span>
              </button>

              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="p-3 border border-neutral-300 hover:border-brand-red text-neutral-600 hover:text-brand-red transition-colors"
                aria-label="Add to wishlist"
              >
                <Heart
                  size={18}
                  className={isWishlisted ? "fill-brand-red text-brand-red" : ""}
                />
              </button>
            </div>

            <a
              href={`https://wa.me/233200000000?text=Hi%20RYZ%20Parfums%2C%20I%20have%20a%20question%20about%20${encodeURIComponent(
                product.title
              )}%20(${currentVariant?.size})`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full border border-emerald-600 text-emerald-700 hover:bg-emerald-50 py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare size={16} />
              <span>Ask About This Scent On WhatsApp</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-200 text-[11px] font-bold text-neutral-800 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand-gold" />
              <span>Cash on Delivery Available</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-brand-gold" />
              <span>1-2 Days Accra Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
