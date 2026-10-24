import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { COLLECTIONS } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    ...Object.keys(COLLECTIONS)
      .filter((slug) => slug !== "ryz-parfums")
      .map((slug) => ({ url: `${siteUrl}/collections/${slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${siteUrl}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
    { url: `${siteUrl}/terms`, priority: 0.2 },
  ];
}
