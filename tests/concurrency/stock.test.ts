import { prisma } from "../../src/lib/prisma";

async function testStockConcurrency() {
  console.log("Testing Stock Concurrency Reservation...");

  const product = await prisma.product.create({
    data: {
      title: "CONCURRENCY TEST SCENT",
      slug: `concurrency-test-${Date.now()}`,
      description: "Testing concurrent stock decrements",
      category: "Unisex",
      concentration: "Extrait de Parfum",
      topNotes: "Bergamot",
      heartNotes: "Rose",
      baseNotes: "Oud",
      variants: {
        create: {
          sku: `CONC-SKU-${Date.now()}`,
          size: "100ml",
          pricePesewas: 29900,
          stock: 5,
        },
      },
    },
    include: { variants: true },
  });

  const variantId = product.variants[0].id;

  const attempts = 10;
  let successfulCheckouts = 0;
  let failedCheckouts = 0;

  for (let i = 0; i < attempts; i++) {
    const res = await prisma.$transaction(async (tx) => {
      const v = await tx.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!v || v.stock < 1) {
        return { success: false, reason: "OUT_OF_STOCK" };
      }

      await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { decrement: 1 } },
      });

      return { success: true };
    });

    if (res.success) {
      successfulCheckouts++;
    } else {
      failedCheckouts++;
    }
  }

  console.log(`Successful checkouts: ${successfulCheckouts}`);
  console.log(`Failed checkouts (out of stock): ${failedCheckouts}`);

  const finalVariant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (finalVariant?.stock !== 0) {
    throw new Error(`Expected final stock 0, got ${finalVariant?.stock}`);
  }

  if (successfulCheckouts !== 5 || failedCheckouts !== 5) {
    throw new Error(`Expected 5 successful and 5 failed checkouts, got ${successfulCheckouts} & ${failedCheckouts}`);
  }

  console.log("ALL STOCK CONCURRENCY TESTS PASSED!");
}

testStockConcurrency().catch((e) => {
  console.error("Stock concurrency test failed:", e);
  process.exit(1);
});
