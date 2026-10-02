import React from "react";
import { StorefrontLayoutShell } from "@/components/layout/StorefrontLayoutShell";
import { ProductCard } from "@/components/product/ProductCard";
import { getCatalogProducts } from "@/lib/services/catalog";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const products = await getCatalogProducts({ query: q });

  return (
    <StorefrontLayoutShell>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-2 block">
            Catalog Search
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-wider text-black">
            Search Results
          </h1>
          <div className="w-16 h-0.5 bg-brand-gold mx-auto mt-3" />
        </div>

        <p className="text-xs text-neutral-500 uppercase tracking-widest mb-6">
          Found {products.length} result{products.length === 1 ? "" : "s"} for &quot;{q}&quot;
        </p>

        {products.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 font-light border border-neutral-100 p-8">
            <p className="text-base font-semibold text-black mb-2">No matching scents found</p>
            <p className="text-xs text-neutral-500">
              Try searching for another fragrance name, designer house (e.g. Creed, Baccarat), or scent note.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </StorefrontLayoutShell>
  );
}
