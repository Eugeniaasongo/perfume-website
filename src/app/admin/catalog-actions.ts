"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import type { ActionResult } from "./actions";

// Must match images.remotePatterns in next.config.mjs, or product pages would fail to render.
const ALLOWED_IMAGE_HOSTS = [/^res\.cloudinary\.com$/, /\.public\.blob\.vercel-storage\.com$/, /^images\.unsplash\.com$/];

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

const productSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  title: z.string().trim().min(2, "Add a product name").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .regex(/^[a-z0-9-]*$/, "The URL name can only use lowercase letters, numbers and dashes"),
  description: z.string().trim().min(10, "Add a short description").max(1000),
  category: z.enum(["Men", "Women", "Unisex"]),
  concentration: z.string().trim().min(2).max(40),
  topNotes: z.string().trim().max(200),
  heartNotes: z.string().trim().max(200),
  baseNotes: z.string().trim().max(200),
  longevityRating: z.coerce.number().int().min(1).max(5),
  sillageRating: z.coerce.number().int().min(1).max(5),
  imageUrl: optional(500).refine((url) => {
    if (!url) return true;
    try {
      const { protocol, hostname } = new URL(url);
      return protocol === "https:" && ALLOWED_IMAGE_HOSTS.some((h) => h.test(hostname));
    } catch {
      return false;
    }
  }, "Images must be https links from Cloudinary, Vercel Blob or Unsplash"),
  inspiredHouse: optional(80),
  inspiredName: optional(80),
});

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export async function saveProductAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const { id, ...fields } = parsed.data;
  const data = {
    ...fields,
    slug: fields.slug || slugify(fields.title),
    inspiredEnabled: formData.get("inspiredEnabled") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
  };

  let productId = id;
  try {
    if (id) {
      await prisma.product.update({ where: { id }, data });
    } else {
      productId = (await prisma.product.create({ data })).id;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Another product already uses that URL name" };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/products/${productId}`);
  return { ok: true, message: "Product saved" };
}

const variantSchema = z.object({
  productId: z.string().uuid(),
  size: z.string().trim().min(2, "Add a size, e.g. 50ml").max(20),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Add a SKU")
    .max(40)
    .regex(/^[A-Z0-9-]+$/, "SKUs can only use letters, numbers and dashes"),
  priceGhs: z.coerce.number().positive("Enter a price").max(100_000),
  stock: z.coerce.number().int().min(0).max(100_000),
});

export async function addVariantAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = variantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  try {
    await prisma.productVariant.create({
      data: {
        productId: parsed.data.productId,
        size: parsed.data.size,
        sku: parsed.data.sku,
        pricePesewas: Math.round(parsed.data.priceGhs * 100),
        stock: parsed.data.stock,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "That SKU is already in use" };
    }
    throw error;
  }
  revalidatePath(`/admin/products/${parsed.data.productId}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Size added" };
}

export async function deleteVariantAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const variantId = String(formData.get("variantId"));
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!variant) return { ok: false, message: "Size not found" };
  if (variant._count.orderItems > 0) {
    return { ok: false, message: "This size has orders, so it can't be deleted. Set its stock to 0 instead." };
  }
  await prisma.productVariant.delete({ where: { id: variantId } });
  revalidatePath(`/admin/products/${variant.productId}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Size deleted" };
}

const discountSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Codes need at least 3 characters")
      .max(30)
      .regex(/^[A-Z0-9_-]+$/, "Codes can only use letters, numbers, dashes and underscores"),
    kind: z.enum(["percent", "amount"]),
    value: z.coerce.number().positive("Enter the discount value"),
    minSpendGhs: z.coerce.number().min(0).max(100_000).default(0),
    maxUses: z.coerce.number().int().min(0).max(1_000_000).default(0),
    expiresAt: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(`${v}T23:59:59`) : null)),
  })
  .refine((d) => d.kind !== "percent" || d.value <= 90, {
    message: "Percentage discounts can be at most 90%",
    path: ["value"],
  });

export async function createDiscountAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = discountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;

  try {
    await prisma.discountCode.create({
      data: {
        code: d.code,
        percentageOff: d.kind === "percent" ? d.value : null,
        amountOffGhs: d.kind === "amount" ? Math.round(d.value * 100) : null,
        minSpendGhs: Math.round(d.minSpendGhs * 100),
        maxUses: d.maxUses || null,
        expiresAt: d.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "That code already exists" };
    }
    throw error;
  }
  revalidatePath("/admin/discounts");
  return { ok: true, message: `Code ${d.code} created` };
}

export async function toggleDiscountAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const discount = await prisma.discountCode.findUnique({ where: { id }, select: { isActive: true } });
  if (!discount) return;
  await prisma.discountCode.update({ where: { id }, data: { isActive: !discount.isActive } });
  revalidatePath("/admin/discounts");
}
