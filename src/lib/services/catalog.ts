import { prisma } from "@/lib/prisma";
import { splitNotes } from "@/lib/format";

export interface CatalogQueryFilters {
  category?: string;
  query?: string;
  inStockOnly?: boolean;
  featuredOnly?: boolean;
  limit?: number;
}

export const COLLECTIONS: Record<string, { title: string; category?: string; blurb: string }> = {
  all: {
    title: "All Fragrances",
    blurb: "Every RYZ extrait, from bright citrus openings to deep oud and amber.",
  },
  "ryz-parfums": {
    title: "The Signature Collection",
    blurb: "Every RYZ extrait, from bright citrus openings to deep oud and amber.",
  },
  men: {
    title: "For Him",
    category: "Men",
    blurb: "Woods, spice and smoke — confident scents built to last from morning into night.",
  },
  women: {
    title: "For Her",
    category: "Women",
    blurb: "Rose, praline and soft musks with the depth of a true extrait.",
  },
  unisex: {
    title: "Unisex",
    category: "Unisex",
    blurb: "Niche-inspired compositions made to be shared.",
  },
};

export async function getInspiredByConfig() {
  const config = await prisma.inspiredByConfig.findUnique({ where: { id: "global" } });
  return {
    globalEnabled: config?.globalEnabled ?? true,
    labelOverride: config?.labelOverride ?? "INSPIRED BY",
    showImages: config?.showImages ?? true,
  };
}

export type CatalogProduct = Awaited<ReturnType<typeof getCatalogProducts>>[number];

export async function getCatalogProducts(filters: CatalogQueryFilters = {}) {
  const { category, inStockOnly, featuredOnly, limit } = filters;
  const query = filters.query?.trim();

  const inspiredConfig = await getInspiredByConfig();

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
      ...(featuredOnly ? { isFeatured: true } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { inspiredHouse: { contains: query, mode: "insensitive" } },
              { inspiredName: { contains: query, mode: "insensitive" } },
              { topNotes: { contains: query, mode: "insensitive" } },
              { heartNotes: { contains: query, mode: "insensitive" } },
              { baseNotes: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      variants: { orderBy: { pricePesewas: "asc" } },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
  });

  const formattedProducts = products
    .filter((product) => product.variants.length > 0)
    .map((product) => {
      const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      const showInspiredBy =
        inspiredConfig.globalEnabled &&
        product.inspiredEnabled &&
        Boolean(product.inspiredHouse && product.inspiredName);

      return {
        id: product.id,
        slug: product.slug,
        title: product.title,
        description: product.description,
        category: product.category,
        concentration: product.concentration,
        imageUrl: product.imageUrl,
        topNotes: splitNotes(product.topNotes),
        priceFromPesewas: product.variants[0].pricePesewas,
        inStock: totalStock > 0,
        inspiredBy: showInspiredBy
          ? {
              label: inspiredConfig.labelOverride,
              house: product.inspiredHouse!,
              name: product.inspiredName!,
            }
          : undefined,
        variants: product.variants.map((v) => ({
          id: v.id,
          size: v.size,
          pricePesewas: v.pricePesewas,
          inStock: v.stock > 0,
        })),
      };
    })
    .filter((p) => (inStockOnly ? p.inStock : true))
    .sort((a, b) => (a.inStock === b.inStock ? 0 : a.inStock ? -1 : 1));

  return limit ? formattedProducts.slice(0, limit) : formattedProducts;
}

export async function getProductBySlug(slug: string) {
  const [product, inspiredConfig] = await Promise.all([
    prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { variants: { orderBy: { pricePesewas: "asc" } } },
    }),
    getInspiredByConfig(),
  ]);

  if (!product) return null;

  const showInspiredBy =
    inspiredConfig.globalEnabled &&
    product.inspiredEnabled &&
    Boolean(product.inspiredHouse && product.inspiredName);

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    category: product.category,
    concentration: product.concentration,
    imageUrl: product.imageUrl,
    topNotes: splitNotes(product.topNotes),
    heartNotes: splitNotes(product.heartNotes),
    baseNotes: splitNotes(product.baseNotes),
    longevityRating: product.longevityRating,
    sillageRating: product.sillageRating,
    inspiredBy: showInspiredBy
      ? {
          label: inspiredConfig.labelOverride,
          house: product.inspiredHouse!,
          name: product.inspiredName!,
        }
      : undefined,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      pricePesewas: v.pricePesewas,
      comparePricePesewas: v.comparePrice,
      stock: v.stock,
    })),
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
