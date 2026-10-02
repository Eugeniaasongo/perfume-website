import React from "react";
import { notFound } from "next/navigation";
import { StorefrontLayoutShell } from "@/components/layout/StorefrontLayoutShell";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { prisma } from "@/lib/prisma";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
    include: {
      variants: true,
    },
  });

  if (!product) {
    notFound();
  }

  const defaultImage =
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80";

  const parseNotes = (notesStr: string | null) => {
    if (!notesStr) return [];
    try {
      return JSON.parse(notesStr);
    } catch {
      return notesStr.split(",").map((s) => s.trim());
    }
  };

  const formattedProduct = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    concentration: product.concentration,
    topNotes: parseNotes(product.topNotes),
    heartNotes: parseNotes(product.heartNotes),
    baseNotes: parseNotes(product.baseNotes),
    longevityRating: product.longevityRating,
    sillageRating: product.sillageRating,
    showInspiredBy: true,
    images: [defaultImage],
    inspiredBy: product.inspiredHouse
      ? {
          house: product.inspiredHouse,
          name: product.inspiredName || "",
          imageUrl: product.inspiredImgUrl || undefined,
        }
      : undefined,
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      pricePesewas: v.pricePesewas,
      stock: v.stock,
      sku: v.sku,
    })),
  };

  return (
    <StorefrontLayoutShell>
      <ProductDetailView product={formattedProduct} />
    </StorefrontLayoutShell>
  );
}
