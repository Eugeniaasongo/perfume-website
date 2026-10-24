import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateShippingFeePesewas, GHANA_REGIONS } from "@/lib/shipping";
import { validateAndApplyDiscount } from "@/lib/pricing";
import { normalizeGhanaPhone } from "@/lib/phone";

export const MAX_QUANTITY_PER_LINE = 10;

export class CheckoutError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
  }
}

const cartItemSchema = z.object({
  variantId: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
});

export const cartItemsSchema = z.array(cartItemSchema).min(1, "Your cart is empty").max(20);

const phoneSchema = z
  .string()
  .transform((value, ctx) => {
    const normalized = normalizeGhanaPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid Ghana mobile number" });
      return z.NEVER;
    }
    return normalized;
  });

export const phoneInputSchema = z.object({ phone: phoneSchema });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const quoteSchema = z.object({
  region: z.enum(GHANA_REGIONS),
  discountCode: optionalText(40),
  items: cartItemsSchema,
});

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, "Enter your full name").max(100),
    customerEmail: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => (v ? v : undefined))
      .pipe(z.string().email("Enter a valid email address").optional()),
    customerPhone: phoneSchema,
    region: z.enum(GHANA_REGIONS),
    city: z.string().trim().min(2, "Enter your city or town").max(100),
    addressLine: z.string().trim().min(4, "Enter your delivery address").max(200),
    landmark: optionalText(200),
    ghanaPostGps: optionalText(20),
    paymentProvider: z.enum(["CASH_ON_DELIVERY", "PAYSTACK"]),
    otp: optionalText(10),
    discountCode: optionalText(40),
    items: cartItemsSchema,
  })
  .superRefine((data, ctx) => {
    if (data.paymentProvider === "PAYSTACK" && !data.customerEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerEmail"],
        message: "An email address is required for online payment receipts",
      });
    }
    if (data.paymentProvider === "CASH_ON_DELIVERY" && !data.otp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otp"],
        message: "Verify your phone number to use Cash on Delivery",
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Merges duplicate cart lines so stock checks see the real requested quantity. */
function mergeItems(items: { variantId: string; quantity: number }[]) {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.variantId, (merged.get(item.variantId) ?? 0) + item.quantity);
  }
  return [...merged].map(([variantId, quantity]) => {
    if (quantity > MAX_QUANTITY_PER_LINE) {
      throw new CheckoutError(`You can order at most ${MAX_QUANTITY_PER_LINE} of each size`);
    }
    return { variantId, quantity };
  });
}

export interface QuoteLine {
  variantId: string;
  productTitle: string;
  productSlug: string;
  size: string;
  quantity: number;
  unitPricePesewas: number;
  totalPesewas: number;
  available: number;
}

export interface Quote {
  lines: QuoteLine[];
  itemsPricePesewas: number;
  shippingPricePesewas: number;
  discountPricePesewas: number;
  totalPricePesewas: number;
  discount?: { code?: string; valid: boolean; message: string };
}

/** Prices a cart entirely from the database; client-side prices are never trusted. */
export async function quoteCart(input: {
  region: string;
  discountCode?: string;
  items: { variantId: string; quantity: number }[];
}): Promise<Quote> {
  const items = mergeItems(input.items);

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: items.map((i) => i.variantId) }, product: { isActive: true } },
    include: { product: { select: { title: true, slug: true } } },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const lines: QuoteLine[] = items.map((item) => {
    const variant = byId.get(item.variantId);
    if (!variant) {
      throw new CheckoutError("An item in your cart is no longer available. Please remove it and try again.");
    }
    return {
      variantId: variant.id,
      productTitle: variant.product.title,
      productSlug: variant.product.slug,
      size: variant.size,
      quantity: item.quantity,
      unitPricePesewas: variant.pricePesewas,
      totalPesewas: variant.pricePesewas * item.quantity,
      available: variant.stock,
    };
  });

  const itemsPricePesewas = lines.reduce((sum, l) => sum + l.totalPesewas, 0);
  const shippingPricePesewas = calculateShippingFeePesewas(input.region, itemsPricePesewas);

  let discountPricePesewas = 0;
  let discount: Quote["discount"];
  if (input.discountCode) {
    const result = await validateAndApplyDiscount({ code: input.discountCode, itemsPricePesewas });
    discountPricePesewas = result.discountPesewas;
    discount = { code: result.valid ? result.code : undefined, valid: result.valid, message: result.message };
  }

  return {
    lines,
    itemsPricePesewas,
    shippingPricePesewas,
    discountPricePesewas,
    totalPricePesewas: Math.max(0, itemsPricePesewas + shippingPricePesewas - discountPricePesewas),
    discount,
  };
}

export function generateOrderNumber(): string {
  // Unambiguous alphabet (no 0/O, 1/I) so numbers are easy to read out over the phone.
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 7; i++) suffix += alphabet[crypto.randomInt(alphabet.length)];
  return `RYZ-${suffix}`;
}

/**
 * Creates an order and atomically reserves stock. Stock decrements are conditional on
 * sufficient stock, so concurrent checkouts can never oversell a variant.
 */
export async function createOrder(input: CheckoutInput & { isCodOtpVerified: boolean }) {
  const quote = await quoteCart(input);

  for (const line of quote.lines) {
    if (line.available < line.quantity) {
      throw new CheckoutError(
        line.available > 0
          ? `Only ${line.available} left of ${line.productTitle} (${line.size})`
          : `${line.productTitle} (${line.size}) is out of stock`,
        409
      );
    }
  }

  const initialStatus =
    input.paymentProvider === "CASH_ON_DELIVERY" ? "AWAITING_DELIVERY_PAYMENT" : "PENDING_PAYMENT";

  const order = await prisma.$transaction(async (tx) => {
    for (const line of quote.lines) {
      const reserved = await tx.productVariant.updateMany({
        where: { id: line.variantId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (reserved.count !== 1) {
        throw new CheckoutError(`${line.productTitle} (${line.size}) just sold out`, 409);
      }
    }

    const appliedCode = quote.discount?.valid ? quote.discount.code : undefined;
    let discountPricePesewas = quote.discountPricePesewas;
    if (appliedCode) {
      const discount = await tx.discountCode.findUnique({ where: { code: appliedCode } });
      const redeemed = await tx.discountCode.updateMany({
        where: {
          code: appliedCode,
          isActive: true,
          ...(discount?.maxUses ? { usedCount: { lt: discount.maxUses } } : {}),
        },
        data: { usedCount: { increment: 1 } },
      });
      if (redeemed.count !== 1) discountPricePesewas = 0;
    }

    const totalPricePesewas = Math.max(
      0,
      quote.itemsPricePesewas + quote.shippingPricePesewas - discountPricePesewas
    );

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        status: initialStatus,
        paymentProvider: input.paymentProvider,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        region: input.region,
        city: input.city,
        addressLine: input.addressLine,
        landmark: input.landmark,
        ghanaPostGps: input.ghanaPostGps,
        itemsPrice: quote.itemsPricePesewas,
        shippingPrice: quote.shippingPricePesewas,
        discountPrice: discountPricePesewas,
        discountCode: discountPricePesewas > 0 ? appliedCode : undefined,
        totalPrice: totalPricePesewas,
        isCodOtpVerified: input.isCodOtpVerified,
        items: {
          create: quote.lines.map((line) => ({
            variantId: line.variantId,
            quantity: line.quantity,
            unitPricePesewas: line.unitPricePesewas,
            totalPesewas: line.totalPesewas,
          })),
        },
      },
    });

    await tx.auditLog.create({
      data: {
        orderId: order.id,
        actor: "CUSTOMER",
        action: "ORDER_CREATED",
        details: `${input.paymentProvider} order created with status ${initialStatus}`,
      },
    });

    return order;
  });

  await recordCustomerOrder(input.customerPhone, input.customerName);
  return order;
}

/** Keeps a customer record per phone number. Bookkeeping only: failures never affect the sale. */
async function recordCustomerOrder(phone: string, name: string) {
  try {
    await prisma.customer.upsert({
      where: { phone },
      update: { name, orderCount: { increment: 1 }, lastOrderAt: new Date() },
      create: { phone, name, orderCount: 1, lastOrderAt: new Date() },
    });
  } catch (error) {
    console.error(`Failed to update customer record for ${phone}:`, error);
  }
}
