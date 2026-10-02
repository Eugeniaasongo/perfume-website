"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { addToCart } from "@/lib/cart";

export interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  ryzImageUrl?: string;
  secondImageUrl?: string;
  inspirationImageUrl?: string;
  inspiredByDesigner?: string;
  inspiredByScent?: string;
  inspiredBy?: { house: string; name: string; imageUrl?: string };
  priceFromGhs?: number;
  pricePesewas?: number;
  isOutOfStock?: boolean;
  inStock?: boolean;
  showInspiredBy?: boolean;
  variants?: { id: string; size: string; pricePesewas: number; stock: number }[];
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  slug,
  ryzImageUrl = "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80",
  secondImageUrl,
  inspirationImageUrl,
  inspiredByDesigner,
  inspiredByScent,
  inspiredBy,
  priceFromGhs,
  pricePesewas,
  isOutOfStock,
  inStock = true,
  showInspiredBy = true,
  variants = [],
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

  const calculatedPriceFromGhs = priceFromGhs ?? (pricePesewas ? pricePesewas / 100 : 299);
  const outOfStockFlag = isOutOfStock ?? !inStock;
  const designerName = inspiredByDesigner || inspiredBy?.house;
  const scentName = inspiredByScent || inspiredBy?.name;

  const selectedVariant = variants[selectedSizeIndex];

  const handleQuickAdd = () => {
    const variantId = selectedVariant ? selectedVariant.id : `${slug}-100ml`;
    const price = selectedVariant ? selectedVariant.pricePesewas : calculatedPriceFromGhs * 100;
    const size = selectedVariant ? selectedVariant.size : "100ml";

    addToCart({
      variantId,
      productId: id,
      productName: title,
      size,
      pricePesewas: price,
      imageUrl: ryzImageUrl,
      quantity: 1,
    });
    alert(`Added ${title} (${size}) to cart!`);
  };

  return (
    <div className={`group relative bg-white border border-neutral-100 flex flex-col justify-between transition-all duration-300 hover:shadow-lg ${outOfStockFlag ? "opacity-60" : ""}`}>
      {/* Top Image Pair & Overlay Actions */}
      <div
        className="relative aspect-square w-full overflow-hidden bg-neutral-50 p-4 flex items-center justify-center cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={`/products/${slug}`} className="relative w-full h-full flex items-center justify-between">
          {/* Main RYZ Bottle */}
          <div className="relative w-2/3 h-full transition-transform duration-500 group-hover:scale-105">
            <Image
              src={isHovered && secondImageUrl ? secondImageUrl : ryzImageUrl}
              alt={`${title} RYZ Parfums bottle`}
              fill
              className="object-contain p-2"
              priority={false}
            />
          </div>

          {/* Inspiration Bottle Thumbnail (If enabled) */}
          {showInspiredBy && (inspirationImageUrl || inspiredBy?.imageUrl) && (
            <div className="relative w-1/3 h-3/4 border-l border-neutral-200/60 pl-2 flex flex-col items-center justify-center">
              <div className="relative w-full h-full">
                <Image
                  src={inspirationImageUrl || inspiredBy?.imageUrl || ""}
                  alt={`Inspired by ${designerName} ${scentName}`}
                  fill
                  className="object-contain filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
            </div>
          )}
        </Link>

        {/* Wishlist Heart Button */}
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          aria-label="Add to wishlist"
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm text-neutral-800 hover:text-brand-gold transition-colors z-10"
        >
          <Heart size={16} className={isWishlisted ? "fill-brand-gold text-brand-gold" : ""} />
        </button>

        {/* Quick Add Hover Button */}
        {!outOfStockFlag && (
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button
              onClick={handleQuickAdd}
              className="w-full bg-black/90 backdrop-blur-md text-white py-2 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-gold hover:text-black transition-colors shadow-md"
            >
              <ShoppingBag size={14} />
              <span>Quick Add</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
        <div>
          {/* Inspired By Label (Alert Red Accent) */}
          {showInspiredBy && (designerName || scentName) && (
            <div className="mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-alert-red block">
                INSPIRED BY
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-black block truncate">
                {designerName} - {scentName}
              </span>
            </div>
          )}

          {/* RYZ Product Title */}
          <Link href={`/products/${slug}`}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 group-hover:text-brand-gold transition-colors">
              {title}
            </h3>
          </Link>
        </div>

        {/* Size Selection Chips */}
        {variants.length > 0 && !outOfStockFlag && (
          <div className="flex gap-1.5 py-1">
            {variants.map((v, idx) => (
              <button
                key={v.id}
                onClick={() => setSelectedSizeIndex(idx)}
                className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                  selectedSizeIndex === idx
                    ? "border-black bg-black text-white"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
        )}

        {/* Price & Stock Indicator */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-wider block text-[10px]">
              Concentration: Extrait
            </span>
            <span className="text-sm font-extrabold text-black tracking-tight inline-block relative">
              GHS {selectedVariant ? (selectedVariant.pricePesewas / 100).toFixed(2) : calculatedPriceFromGhs.toFixed(2)}
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-gold" />
            </span>
          </div>

          {outOfStockFlag ? (
            <span className="text-xs font-serif italic text-neutral-500">
              Out of stock
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
              In Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
