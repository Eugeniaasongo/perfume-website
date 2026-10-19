import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/ProductCard";
import { COLLECTIONS, getCatalogProducts } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = COLLECTIONS[slug.toLowerCase()];
  return collection ? { title: collection.title, description: collection.blurb } : {};
}

const tabs = [
  { slug: "all", label: "All" },
  { slug: "men", label: "For Him" },
  { slug: "women", label: "For Her" },
  { slug: "unisex", label: "Unisex" },
];

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const key = slug.toLowerCase();
  const collection = COLLECTIONS[key];
  if (!collection) notFound();

  const products = await getCatalogProducts({ category: collection.category });

  return (
    <div className="container-page py-12 lg:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Collection</p>
        <h1 className="heading-display mt-3 text-5xl">{collection.title}</h1>
        <p className="mt-4 text-stone">{collection.blurb}</p>
      </header>

      <nav aria-label="Collections" className="mt-10 flex justify-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const active = tab.slug === key || (key === "ryz-parfums" && tab.slug === "all");
          return (
            <Link
              key={tab.slug}
              href={`/collections/${tab.slug}`}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap border px-4 py-2 text-xs uppercase tracking-label transition-colors ${
                active ? "border-ink bg-ink text-ivory" : "border-line text-ink hover:border-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <p className="mb-6 mt-10 text-xs text-stone">
        {products.length} fragrance{products.length === 1 ? "" : "s"}
      </p>

      {products.length === 0 ? (
        <div className="border border-dashed border-line py-20 text-center">
          <p className="text-stone">Nothing here just yet — new scents are on their way.</p>
          <Link href="/collections/all" className="btn-outline mt-6">
            Browse all fragrances
          </Link>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
