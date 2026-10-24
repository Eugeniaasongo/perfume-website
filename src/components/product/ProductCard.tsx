"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { BottleArt } from "@/components/ui/BottleArt";
import { showToast } from "@/components/ui/Toaster";
import { addToCart } from "@/lib/cart";
import { formatGhs } from "@/lib/format";
import type { CatalogProduct } from "@/lib/services/catalog";

export function ProductCard({ product, priority }: { product: CatalogProduct; priority?: boolean }) {
  const quickAddVariant = product.variants.find((v) => v.inStock);
  const hasRange = new Set(product.variants.map((v) => v.pricePesewas)).size > 1;

  const handleQuickAdd = () => {
    if (!quickAddVariant) return;
    addToCart({
      variantId: quickAddVariant.id,
      productId: product.id,
      slug: product.slug,
      productName: product.title,
      size: quickAddVariant.size,
      pricePesewas: quickAddVariant.pricePesewas,
      imageUrl: product.imageUrl,
      quantity: 1,
    });
    showToast({
      title: "Added to your bag",
      description: `${product.title} · ${quickAddVariant.size}`,
      href: "/cart",
      hrefLabel: "View bag",
    });
  };

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <Link href={`/products/${product.slug}`} className="absolute inset-0" aria-label={product.title}>
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
            <BottleArt
              title={product.title}
              slug={product.slug}
              category={product.category}
              concentration={product.concentration}
              imageUrl={product.imageUrl}
              priority={priority}
            />
          </div>
        </Link>

        {!product.inStock && (
          <span className="absolute left-3 top-3 bg-ivory px-2.5 py-1 text-[10px] uppercase tracking-label text-stone">
            Sold out
          </span>
        )}

        {quickAddVariant && (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center bg-ivory text-ink shadow-sm transition-all duration-300 hover:bg-ink hover:text-ivory lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100"
            aria-label={`Quick add ${product.title} ${quickAddVariant.size}`}
          >
            <Plus size={18} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {product.inspiredBy && (
          <p className="mb-1 truncate text-[11px]">
            <span className="inspired-label">{product.inspiredBy.label}</span>{" "}
            <span className="text-stone">
              {product.inspiredBy.house} {product.inspiredBy.name}
            </span>
          </p>
        )}
        <h3 className="font-display text-xl leading-tight text-ink">
          <Link href={`/products/${product.slug}`} className="hover:text-brand-gold-dark">
            {product.title}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-stone">
          {product.concentration}
          {product.topNotes.length > 0 && ` · ${product.topNotes.slice(0, 2).join(", ")}`}
        </p>
        <p className="mt-2 text-sm text-ink">
          {hasRange && <span className="text-stone">From </span>}
          {formatGhs(product.priceFromPesewas)}
        </p>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < 4} />
      ))}
    </div>
  );
}
