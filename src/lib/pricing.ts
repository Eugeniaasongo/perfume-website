import { prisma } from "@/lib/prisma";

export interface ShippingAddressInput {
  region: string;
  city: string;
}

export interface DiscountApplyInput {
  code: string;
  itemsPricePesewas: number;
}

export function calculateShippingFeePesewas(region: string, itemsPricePesewas: number): number {
  if (itemsPricePesewas >= 50000) {
    return 0;
  }

  const normalizedRegion = region.trim().toLowerCase();

  if (normalizedRegion === "accra") {
    return 2000;
  } else if (normalizedRegion.includes("greater accra")) {
    return 3000;
  } else {
    return 4500;
  }
}

export async function validateAndApplyDiscount(input: DiscountApplyInput) {
  const discount = await prisma.discountCode.findUnique({
    where: { code: input.code.toUpperCase().trim() },
  });

  if (!discount || !discount.isActive) {
    return { valid: false, message: "Invalid or expired discount code", discountPesewas: 0 };
  }

  if (discount.expiresAt && discount.expiresAt < new Date()) {
    return { valid: false, message: "Discount code has expired", discountPesewas: 0 };
  }

  if (discount.maxUses && discount.usedCount >= discount.maxUses) {
    return { valid: false, message: "Discount code usage limit reached", discountPesewas: 0 };
  }

  if (input.itemsPricePesewas < discount.minSpendGhs) {
    const minGhs = (discount.minSpendGhs / 100).toFixed(2);
    return {
      valid: false,
      message: `Minimum order spend of GHS ${minGhs} required for this code`,
      discountPesewas: 0,
    };
  }

  let discountPesewas = 0;

  if (discount.percentageOff) {
    discountPesewas = Math.round((input.itemsPricePesewas * discount.percentageOff) / 100);
  } else if (discount.amountOffGhs) {
    discountPesewas = discount.amountOffGhs;
  }

  discountPesewas = Math.min(discountPesewas, input.itemsPricePesewas);

  return {
    valid: true,
    code: discount.code,
    discountPesewas,
    message: "Discount applied successfully",
  };
}
