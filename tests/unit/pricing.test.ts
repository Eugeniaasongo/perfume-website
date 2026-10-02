import { calculateShippingFeePesewas, validateAndApplyDiscount } from "../../src/lib/pricing";

async function testPricingEngine() {
  console.log("Testing Pricing, Shipping & Discount Engine...");

  const accraShipping = calculateShippingFeePesewas("Accra", 29900);
  if (accraShipping !== 2000) throw new Error(`Accra shipping expected 2000 pesewas, got ${accraShipping}`);

  const gAccraShipping = calculateShippingFeePesewas("Greater Accra", 29900);
  if (gAccraShipping !== 3000) throw new Error(`Greater Accra shipping expected 3000 pesewas, got ${gAccraShipping}`);

  const otherShipping = calculateShippingFeePesewas("Ashanti", 29900);
  if (otherShipping !== 4500) throw new Error(`Other region shipping expected 4500 pesewas, got ${otherShipping}`);

  const freeShipping = calculateShippingFeePesewas("Ashanti", 55000);
  if (freeShipping !== 0) throw new Error(`Free shipping expected 0 pesewas, got ${freeShipping}`);

  console.log("All Shipping calculation tests passed!");

  const result = await validateAndApplyDiscount({
    code: "WELCOME10",
    itemsPricePesewas: 30000,
  });

  if (!result.valid || result.discountPesewas !== 3000) {
    throw new Error(`Discount expected 3000 pesewas off, got ${JSON.stringify(result)}`);
  }

  console.log("All Discount calculation tests passed!");
}

testPricingEngine().catch((e) => {
  console.error("Pricing test failed:", e);
  process.exit(1);
});
