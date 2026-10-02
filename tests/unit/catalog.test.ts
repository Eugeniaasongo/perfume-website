import { getCatalogProducts } from "../../src/lib/services/catalog";

async function testCatalog() {
  console.log("Testing Catalog Search & Filtering...");

  const royalOud = await getCatalogProducts({ query: "Royal Oud" });
  console.log(`Query 'Royal Oud' returned ${royalOud.length} item(s)`);
  if (royalOud.length === 0) throw new Error("Search by title failed");

  const creedItems = await getCatalogProducts({ query: "Creed" });
  console.log(`Query 'Creed' returned ${creedItems.length} item(s)`);
  if (creedItems.length === 0) throw new Error("Search by inspired house failed");

  const menItems = await getCatalogProducts({ category: "Men" });
  console.log(`Category 'Men' returned ${menItems.length} item(s)`);

  console.log("ALL CATALOG TESTS PASSED SUCCESSFULLY!");
}

testCatalog().catch((e) => {
  console.error("Catalog test failed:", e);
  process.exit(1);
});
