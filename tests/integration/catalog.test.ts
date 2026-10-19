import { after, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { getCatalogProducts, getProductBySlug } from "@/lib/services/catalog";
import { createTestProduct, cleanupTestData } from "../helpers";

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test("search matches title, inspiration and notes case-insensitively", async () => {
  const product = await createTestProduct();
  const byTitle = await getCatalogProducts({ query: product.title.toLowerCase() });
  assert.ok(byTitle.some((p) => p.id === product.id));

  const byInspiration = await getCatalogProducts({ query: product.inspiredName!.toUpperCase() });
  assert.ok(byInspiration.some((p) => p.id === product.id));
});

test("hidden products are excluded from the storefront", async () => {
  const product = await createTestProduct();
  await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
  assert.equal(await getProductBySlug(product.slug), null);
  const all = await getCatalogProducts();
  assert.ok(!all.some((p) => p.id === product.id));
});

test("the global inspired-by toggle hides comparison labels", async () => {
  const product = await createTestProduct();
  await prisma.inspiredByConfig.upsert({
    where: { id: "global" },
    update: { globalEnabled: false },
    create: { id: "global", globalEnabled: false },
  });
  try {
    const detail = await getProductBySlug(product.slug);
    assert.equal(detail?.inspiredBy, undefined);
  } finally {
    await prisma.inspiredByConfig.update({ where: { id: "global" }, data: { globalEnabled: true } });
  }
  const detail = await getProductBySlug(product.slug);
  assert.equal(detail?.inspiredBy?.house, "Test House");
});
