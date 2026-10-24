import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { ProductGrid } from "@/components/product/ProductCard";
import { getCatalogProducts, getProductBySlug } from "@/lib/services/catalog";
import { formatGhs } from "@/lib/format";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const from = product.variants[0] ? ` From ${formatGhs(product.variants[0].pricePesewas)}.` : "";
  return {
    title: product.title,
    description: `${product.description}${from}`,
    openGraph: { title: `${product.title} | DHA Perfumes`, description: product.description },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await getCatalogProducts({ category: product.category }))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    brand: { "@type": "Brand", name: "DHA Perfumes" },
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      name: v.size,
      priceCurrency: "GHS",
      price: (v.pricePesewas / 100).toFixed(2),
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProductDetailView product={product} />
      {related.length > 0 && (
        <section className="container-page border-t border-line pt-16">
          <h2 className="heading-display mb-8 text-3xl">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
