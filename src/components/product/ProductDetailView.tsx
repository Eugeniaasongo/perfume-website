"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Heart, ShoppingBag, ShieldCheck, Check } from "lucide-react";
import { addToCart } from "@/lib/cart";

export interface ProductDetailProps {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    concentration: string;
    topNotes: string[];
    heartNotes: string[];
    baseNotes: string[];
    longevityRating: number; // 1 to 5
    sillageRating: number; // 1 to 5
    showInspiredBy: boolean;
    inspiredBy?: {
      house: string;
      name: string;
      imageUrl?: string;
    };
    images: string[];
    variants: {
      id: string;
      size: string;
      pricePesewas: number;
      stock: number;
      sku: string;
    }[];
  };
}

export const ProductDetailView: React.FC<ProductDetailProps> = ({ product }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const activeVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const activeImage = product.images[selectedImageIndex] || product.images[0];
  const isOutOfStock = activeVariant ? activeVariant.stock <= 0 : true;

  const handleAddToCart = () => {
    if (isOutOfStock || !activeVariant) return;

    addToCart({
      variantId: activeVariant.id,
      productId: product.id,
      productName: product.title,
      size: activeVariant.size,
      pricePesewas: activeVariant.pricePesewas,
      imageUrl: product.images[0],
      quantity,
    });

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello RYZ Parfums, I have a question about ${product.title} (${activeVariant?.size || "100ml"}).`
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Gallery Column */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-neutral-50 border border-neutral-200 overflow-hidden">
            <Image
              src={activeImage}
              alt={product.title}
              fill
              className="object-contain p-6"
              priority
            />
          </div>

          {/* Thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative w-20 h-20 bg-neutral-50 border flex-shrink-0 transition-all ${
                  selectedImageIndex === idx ? "border-brand-gold ring-1 ring-brand-gold" : "border-neutral-200"
                }`}
              >
                <Image src={img} alt="Thumbnail" fill className="object-contain p-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Meta Column */}
        <div className="space-y-6">
          <div>
            {/* Inspired By Panel */}
            {product.showInspiredBy && product.inspiredBy && (
              <div className="mb-3 inline-block bg-neutral-50 border border-neutral-200 p-2 px-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-alert-red block">
                  INSPIRED BY
                </span>
                <span className="text-xs font-bold uppercase text-black">
                  {product.inspiredBy.house} - {product.inspiredBy.name}
                </span>
              </div>
            )}

            <h1 className="text-3xl font-extrabold uppercase tracking-wider text-black">
              {product.title}
            </h1>

            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-extrabold text-black">
                GHS {activeVariant ? (activeVariant.pricePesewas / 100).toFixed(2) : "0.00"}
              </span>
              <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider">
                Concentration: {product.concentration}
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-4">
            {product.description}
          </p>

          {/* Size Selector Chips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
              Select Size
            </label>
            <div className="flex gap-3">
              {product.variants.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantIndex(idx)}
                  className={`px-4 py-2 border text-xs font-bold uppercase tracking-wider transition-all ${
                    selectedVariantIndex === idx
                      ? "border-black bg-black text-white"
                      : "border-neutral-300 text-black hover:border-black"
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex gap-4 items-center pt-2">
            <div className="flex items-center border border-neutral-300">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-xs font-bold hover:bg-neutral-100"
              >
                -
              </button>
              <span className="px-4 text-xs font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-xs font-bold hover:bg-neutral-100"
              >
                +
              </button>
            </div>

            <button
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`flex-1 py-3 px-6 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                addedSuccess
                  ? "bg-emerald-600 text-white"
                  : isOutOfStock
                  ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                  : "bg-black text-white hover:bg-brand-gold hover:text-black shadow-md"
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check size={16} />
                  <span>Added to Selection</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={16} />
                  <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                </>
              )}
            </button>
          </div>

          {/* WhatsApp Direct Query Link */}
          <a
            href={`https://wa.me/233240001122?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center border border-emerald-600 text-emerald-700 hover:bg-emerald-50 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Ask about this scent on WhatsApp
          </a>

          {/* Longevity and Sillage Meters */}
          <div className="border-t border-neutral-200 pt-4 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-black">
              Performance Attributes
            </h3>

            <div>
              <div className="flex justify-between text-xs text-neutral-600 mb-1">
                <span>Longevity</span>
                <span>{product.longevityRating} / 5 (8-12 Hours)</span>
              </div>
              <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-brand-gold h-full"
                  style={{ width: `${(product.longevityRating / 5) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-600 mb-1">
                <span>Sillage / Projection</span>
                <span>{product.sillageRating} / 5 (Strong)</span>
              </div>
              <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-brand-gold h-full"
                  style={{ width: `${(product.sillageRating / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Notes Pyramid */}
          <div className="border-t border-neutral-200 pt-4 space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-black">
              Fragrance Notes Pyramid
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-neutral-50 p-2 border border-neutral-200">
                <span className="font-bold text-black block mb-1">Top Notes</span>
                <span className="text-[11px] text-neutral-600">{product.topNotes.join(", ")}</span>
              </div>
              <div className="bg-neutral-50 p-2 border border-neutral-200">
                <span className="font-bold text-black block mb-1">Heart Notes</span>
                <span className="text-[11px] text-neutral-600">{product.heartNotes.join(", ")}</span>
              </div>
              <div className="bg-neutral-50 p-2 border border-neutral-200">
                <span className="font-bold text-black block mb-1">Base Notes</span>
                <span className="text-[11px] text-neutral-600">{product.baseNotes.join(", ")}</span>
              </div>
            </div>
          </div>

          {/* COD Trust Badge */}
          <div className="bg-neutral-50 border border-brand-gold/30 p-3 flex items-center justify-center gap-2 text-xs font-bold text-brand-gold-dark uppercase">
            <ShieldCheck size={18} className="text-brand-gold" />
            <span>CASH ON DELIVERY ACCEPTED NATIONWIDE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
