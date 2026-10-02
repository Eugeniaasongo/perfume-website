import React from "react";
import { notFound } from "next/navigation";
import { StorefrontLayoutShell } from "@/components/layout/StorefrontLayoutShell";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { prisma } from "@/lib/prisma";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: true,
    },
  });

  if (!product) {
    notFound();
  }

  const globalConfig = await prisma.inspiredByConfig.findUnique({
    where: { id: "global" },
  });

  const showInspiredBy =
    (globalConfig?.globalEnabled ?? true) &&
    product.inspiredEnabled &&
    Boolean(product.inspiredHouse) &&
    Boolean(product.inspiredName);

  const formattedProduct = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    category: product.category,
    concentration: product.concentration,
    topNotes: product.topNotes.split(",").map((n) => n.trim()),
    heartNotes: product.heartNotes.split(",").map((n) => n.trim()),
    baseNotes: product.baseNotes.split(",").map((n) => n.trim()),
    longevityRating: product.longevityRating,
    sillageRating: product.sillageRating,
    inspiredBy: showInspiredBy
      ? {
          house: product.inspiredHouse!,
          name: product.inspiredName!,
          labelOverride: globalConfig?.labelOverride || "INSPIRED BY",
        }
      : undefined,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      pricePesewas: v.pricePesewas,
      stock: v.stock,
    })),
  };

  return (
    <StorefrontLayoutShell>
      <ProductDetailView product={formattedProduct} />
    </StorefrontLayoutShell>
  );
}
