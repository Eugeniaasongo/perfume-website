import { prisma } from "@/lib/prisma";

export interface CatalogQueryFilters {
  category?: string;
  query?: string;
  size?: string;
  minPriceGhs?: number;
  maxPriceGhs?: number;
  inStockOnly?: boolean;
}

export async function getCatalogProducts(filters: CatalogQueryFilters = {}) {
  const { category, query, inStockOnly } = filters;

  const globalConfig = await prisma.inspiredByConfig.findUnique({
    where: { id: "global" },
  });

  const isInspiredByEnabled = globalConfig ? globalConfig.globalEnabled : true;
  const labelOverride = globalConfig ? globalConfig.labelOverride : "INSPIRED BY";

  const products = await prisma.product.findMany({
    where: {
      ...(category && category !== "all" && category !== "ryz-parfums"
        ? { category: { equals: category } }
        : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
              { inspiredHouse: { contains: query } },
              { inspiredName: { contains: query } },
            ],
          }
        : {}),
    },
    include: {
      variants: true,
    },
  });

  const formattedProducts = products
    .map((product) => {
      const availableVariants = product.variants;
      const minVariantPrice = availableVariants.length
        ? Math.min(...availableVariants.map((v) => v.pricePesewas))
        : 29900;

      const totalStock = availableVariants.reduce((sum, v) => sum + v.stock, 0);
      const inStock = totalStock > 0;

      const showProductInspiredBy =
        isInspiredByEnabled &&
        product.inspiredEnabled &&
        product.inspiredHouse &&
        product.inspiredName;

      return {
        id: product.id,
        slug: product.slug,
        title: product.title,
        description: product.description,
        category: product.category,
        concentration: product.concentration,
        pricePesewas: minVariantPrice,
        inStock,
        totalStock,
        inspiredBy: showProductInspiredBy
          ? {
              house: product.inspiredHouse!,
              name: product.inspiredName!,
              labelOverride,
            }
          : undefined,
        sizes: availableVariants.map((v) => v.size),
        variants: availableVariants,
      };
    })
    .filter((p) => (inStockOnly ? p.inStock : true))
    .sort((a, b) => {
      if (a.inStock === b.inStock) return 0;
      return a.inStock ? -1 : 1;
    });

  return formattedProducts;
}
