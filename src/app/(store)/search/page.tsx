import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductCard";
import { getCatalogProducts } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search", robots: { index: false } };

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 100);
  const products = query ? await getCatalogProducts({ query }) : [];

  return (
    <div className="container-page py-12 lg:py-16">
      <form action="/search" role="search" className="mx-auto flex max-w-2xl items-center gap-3 border-b border-ink pb-3">
        <Search size={20} strokeWidth={1.5} className="text-stone" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search scents, notes or inspirations"
          className="flex-1 bg-transparent font-display text-2xl placeholder:text-stone-light focus:outline-none sm:text-3xl"
          aria-label="Search fragrances"
        />
      </form>

      {query && (
        <p className="mb-8 mt-10 text-sm text-stone">
          {products.length} result{products.length === 1 ? "" : "s"} for “{query}”
        </p>
      )}

      {query && products.length === 0 && (
        <div className="mx-auto max-w-md py-12 text-center">
          <p className="font-display text-2xl text-ink">No matches found</p>
          <p className="mt-2 text-sm text-stone">
            Try a note like “oud” or “rose”, or the designer fragrance you love.
          </p>
          <Link href="/collections/all" className="btn-outline mt-6">
            Browse all fragrances
          </Link>
        </div>
      )}

      {products.length > 0 && <ProductGrid products={products} />}
    </div>
  );
}
