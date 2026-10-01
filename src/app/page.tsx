import React from "react";
import { StorefrontLayoutShell } from "@/components/layout/StorefrontLayoutShell";
import { HeroSlider } from "@/components/home/HeroSlider";
import { BrandPromise } from "@/components/home/BrandPromise";
import { ProductCard } from "@/components/product/ProductCard";
import { getCatalogProducts } from "@/lib/services/catalog";

export default async function HomePage() {
  const products = await getCatalogProducts();

  return (
    <StorefrontLayoutShell>
      <HeroSlider />
      <BrandPromise />

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center mb-10 text-center">
          <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-2">
            Signature Selection
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-wider">
            FEATURED FRAGRANCES
          </h2>
          <div className="w-16 h-0.5 bg-brand-gold mt-3" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>
    </StorefrontLayoutShell>
  );
}
