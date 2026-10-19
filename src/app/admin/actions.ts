"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { recordCodCashCollection } from "@/lib/cod";
import { transitionOrderState, type OrderState, allowedTransitions } from "@/lib/orders/state-machine";

export type ActionResult = { ok: boolean; message: string } | undefined;

function fail(error: unknown): ActionResult {
  return { ok: false, message: error instanceof Error ? error.message : "Something went wrong" };
}

export async function transitionOrderAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const orderId = String(formData.get("orderId"));
  const targetState = String(formData.get("targetState")) as OrderState;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  if (!(targetState in allowedTransitions)) return { ok: false, message: "Unknown status" };

  try {
    await transitionOrderState({ orderId, targetState, actor: "ADMIN", notes });
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin");
    return { ok: true, message: "Order updated" };
  } catch (error) {
    return fail(error);
  }
}

const codSchema = z.object({
  orderId: z.string().uuid(),
  collectedGhs: z.coerce.number().positive().max(1_000_000),
  collectorName: z.string().trim().min(2).max(80),
  notes: z.string().trim().max(500).optional(),
});

export async function recordCodAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = codSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  try {
    const log = await recordCodCashCollection({
      orderId: parsed.data.orderId,
      collectedAmountPesewas: Math.round(parsed.data.collectedGhs * 100),
      collectorName: parsed.data.collectorName,
      notes: parsed.data.notes || undefined,
    });
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);
    return log.isReconciled
      ? { ok: true, message: "Cash recorded and order marked delivered" }
      : { ok: false, message: "Amount differs from order total — order placed on hold for review" };
  } catch (error) {
    return fail(error);
  }
}

const variantSchema = z.object({
  variantId: z.string().uuid(),
  priceGhs: z.coerce.number().positive().max(100_000),
  stock: z.coerce.number().int().min(0).max(100_000),
});

export async function updateVariantAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = variantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  await prisma.productVariant.update({
    where: { id: parsed.data.variantId },
    data: { pricePesewas: Math.round(parsed.data.priceGhs * 100), stock: parsed.data.stock },
  });
  revalidatePath("/admin/products");
  return { ok: true, message: "Saved" };
}

export async function toggleProductActiveAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId"));
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { isActive: true } });
  if (!product) return;
  await prisma.product.update({ where: { id: productId }, data: { isActive: !product.isActive } });
  revalidatePath("/admin/products");
}

const settingsSchema = z.object({
  labelOverride: z.string().trim().min(1).max(40),
});

export async function updateInspiredSettingsAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({ labelOverride: formData.get("labelOverride") });
  if (!parsed.success) return { ok: false, message: "Label must be 1–40 characters" };

  const data = {
    globalEnabled: formData.get("globalEnabled") === "on",
    showImages: formData.get("showImages") === "on",
    labelOverride: parsed.data.labelOverride.toUpperCase(),
  };
  await prisma.inspiredByConfig.upsert({
    where: { id: "global" },
    update: data,
    create: { id: "global", ...data },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved — the storefront is updated" };
}
