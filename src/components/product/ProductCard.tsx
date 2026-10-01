"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Eye } from "lucide-react";

export interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  pricePesewas: number;
  inStock: boolean;
  inspiredBy?: {
    house: string;
    name: string;
  };
  sizes?: string[];
  ryzImage?: string;
  inspirationImage?: string;
}

export function ProductCard({
  slug,
  title,
  pricePesewas,
  inStock,
  inspiredBy,
  sizes = ["30ml", "50ml", "100ml"],
}: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState(sizes[0] || "100ml");
  const [isWishlisted, setIsWishlisted] = useState(false);

  const priceGhs = (pricePesewas / 100).toFixed(2);

  return (
    <div
      className={`group border border-neutral-200 bg-white p-4 flex flex-col justify-between transition-all hover:shadow-lg relative ${
        !inStock ? "opacity-75" : ""
      }`}
    >
      <button
        onClick={() => setIsWishlisted(!isWishlisted)}
        className="absolute top-6 right-6 z-20 text-neutral-400 hover:text-brand-red transition-colors"
        aria-label="Add to wishlist"
      >
        <Heart
          size={18}
          className={isWishlisted ? "fill-brand-red text-brand-red" : ""}
        />
      </button>

      <div>
        <Link href={`/products/${slug}`} className="block relative mb-4">
          <div className="grid grid-cols-3 gap-2 items-center bg-neutral-50 p-4 border border-neutral-100 min-h-[220px]">
            <div className="col-span-2 flex flex-col items-center justify-center border-r border-neutral-200 pr-2">
              <div className="w-20 h-32 border-2 border-brand-gold bg-gradient-to-b from-neutral-900 via-stone-900 to-black p-2 flex flex-col justify-between items-center shadow-md">
                <div className="w-4 h-3 bg-brand-gold rounded-t-sm" />
                <div className="text-center">
                  <span className="text-[8px] text-brand-gold font-bold tracking-widest block uppercase">
                    RYZ
                  </span>
                  <span className="text-[10px] text-white font-extrabold tracking-wider line-clamp-1 uppercase">
                    {title}
                  </span>
                </div>
                <span className="text-[7px] text-neutral-400 tracking-widest uppercase">
                  100ML
                </span>
              </div>
            </div>

            <div className="col-span-1 flex flex-col items-center justify-center pl-1 text-center">
              <div className="w-10 h-16 border border-neutral-300 bg-neutral-200 flex items-center justify-center p-1 mb-1">
                <span className="text-[8px] font-bold text-neutral-600 uppercase">
                  {inspiredBy?.house ? inspiredBy.house.substring(0, 3) : "LUX"}
                </span>
              </div>
              <span className="text-[8px] text-neutral-500 font-semibold uppercase line-clamp-2">
                {inspiredBy?.name || "Original Scent"}
              </span>
            </div>
          </div>
        </Link>

        {inspiredBy && (
          <div className="mb-2">
            <span className="text-[10px] font-extrabold tracking-widest text-brand-red uppercase block">
              INSPIRED BY
            </span>
            <span className="text-xs font-bold text-black uppercase tracking-wider block">
              {inspiredBy.house} - {inspiredBy.name}
            </span>
          </div>
        )}

        <Link
          href={`/products/${slug}`}
          className="text-sm font-extrabold text-black uppercase tracking-wider hover:text-brand-gold transition-colors block mb-1 line-clamp-1"
        >
          {title}
        </Link>

        <div className="mb-3">
          <div className="inline-block relative">
            <span className="text-xs font-semibold text-neutral-700">From </span>
            <span className="text-sm font-extrabold text-black">
              GHS {priceGhs}
            </span>
            <div className="w-full h-0.5 bg-brand-gold mt-0.5" />
          </div>
        </div>

        <div className="flex gap-1.5 mb-4">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`text-[10px] font-semibold px-2 py-1 border transition-colors ${
                selectedSize === size
                  ? "border-black bg-black text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-black"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        {!inStock ? (
          <div>
            <span className="font-script italic text-xs text-neutral-500 block mb-2">
              Out of stock
            </span>
            <button
              className="w-full border border-neutral-300 text-neutral-600 py-2 text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors"
              onClick={() => alert("We will notify you when this item is back in stock!")}
            >
              Notify Me
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <button
              className="col-span-3 bg-black text-white py-2 px-3 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-black transition-colors flex items-center justify-center gap-1.5"
              onClick={() => alert(`Added ${title} (${selectedSize}) to cart!`)}
            >
              <ShoppingBag size={14} />
              <span>Quick Add</span>
            </button>
            <Link
              href={`/products/${slug}`}
              className="col-span-1 border border-black flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors"
              aria-label="View product details"
            >
              <Eye size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
