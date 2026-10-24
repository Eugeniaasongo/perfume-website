import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function uniqueSuffix() {
  return crypto.randomBytes(4).toString("hex");
}

export async function createTestProduct(stock = 10, pricePesewas = 29900) {
  const suffix = uniqueSuffix();
  return prisma.product.create({
    data: {
      title: `TEST SCENT ${suffix}`,
      slug: `test-scent-${suffix}`,
      description: "Test product",
      category: "Unisex",
      concentration: "Extrait de Parfum",
      topNotes: "Bergamot",
      heartNotes: "Rose",
      baseNotes: "Oud",
      inspiredHouse: "Test House",
      inspiredName: `Test Inspiration ${suffix}`,
      variants: { create: { sku: `TEST-${suffix}`, size: "100ml", pricePesewas, stock } },
    },
    include: { variants: true },
  });
}

export function testPhone() {
  return `+23324${crypto.randomInt(1000000, 9999999)}`;
}

export const baseCheckout = {
  customerName: "Ama Serwaa",
  region: "Greater Accra" as const,
  city: "Osu",
  addressLine: "12 Oxford Street",
};

/** Removes everything created through createTestProduct, including orders that reference it. */
export async function cleanupTestData() {
  const variants = await prisma.productVariant.findMany({
    where: { product: { slug: { startsWith: "test-scent-" } } },
    select: { id: true },
  });
  const variantIds = variants.map((v) => v.id);
  const orders = await prisma.order.findMany({
    where: { items: { some: { variantId: { in: variantIds } } } },
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);
  await prisma.auditLog.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: "test-scent-" } } });
  await prisma.discountCode.deleteMany({ where: { code: { startsWith: "T" }, maxUses: 1, percentageOff: 10 } });
}
