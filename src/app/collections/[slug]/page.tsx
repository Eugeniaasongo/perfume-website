import React from "react";
import { StorefrontLayoutShell } from "@/components/layout/StorefrontLayoutShell";
import { ProductCard } from "@/components/product/ProductCard";
import { getCatalogProducts } from "@/lib/services/catalog";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  const categoryMap: Record<string, string> = {
    men: "Men",
    women: "Women",
    unisex: "Unisex",
    makeup: "Makeup",
    "ryz-parfums": "RYZ Parfums",
  };

  const categoryName = categoryMap[slug.toLowerCase()] || "Collection";
  const products = await getCatalogProducts({
    category: categoryName === "RYZ Parfums" ? undefined : categoryName,
  });

  return (
    <StorefrontLayoutShell>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-2 block">
            RYZ Parfums Collection
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-wider text-black">
            {categoryName}
          </h1>
          <div className="w-16 h-0.5 bg-brand-gold mx-auto mt-3" />
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 font-light">
            No fragrances found in this collection at the moment.
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
