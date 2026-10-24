"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { recordCodCashCollection } from "@/lib/cod";
import { transitionOrderState, type OrderState, allowedTransitions } from "@/lib/orders/state-machine";
import { refundOrder, RefundError } from "@/lib/orders/refunds";
import { normalizeGhanaPhone } from "@/lib/phone";
import { notifyBackInStock } from "@/lib/notifications/orders";

export type ActionResult = { ok: boolean; message: string } | undefined;

function fail(error: unknown): ActionResult {
  return { ok: false, message: error instanceof Error ? error.message : "Something went wrong" };
}

export async function transitionOrderAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const orderId = String(formData.get("orderId"));
  const targetState = String(formData.get("targetState")) as OrderState;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const riderName = String(formData.get("riderName") ?? "").trim() || undefined;
  const riderPhoneRaw = String(formData.get("riderPhone") ?? "").trim();
  const deliveryNote = String(formData.get("deliveryNote") ?? "").trim().slice(0, 300) || undefined;

  if (!(targetState in allowedTransitions)) return { ok: false, message: "Unknown status" };

  const riderPhone = riderPhoneRaw ? normalizeGhanaPhone(riderPhoneRaw) : undefined;
  if (riderPhoneRaw && !riderPhone) return { ok: false, message: "Enter a valid Ghana number for the rider" };

  try {
    await transitionOrderState({
      orderId,
      targetState,
      actor: "ADMIN",
      notes,
      details: { riderName: riderName?.slice(0, 80), riderPhone: riderPhone ?? undefined, deliveryNote },
    });
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

  const before = await prisma.productVariant.findUnique({ where: { id: parsed.data.variantId }, select: { stock: true } });
  await prisma.productVariant.update({
    where: { id: parsed.data.variantId },
    data: { pricePesewas: Math.round(parsed.data.priceGhs * 100), stock: parsed.data.stock },
  });
  revalidatePath("/admin/products");

  if (before && before.stock <= 0 && parsed.data.stock > 0) {
    const notified = await notifyBackInStock(parsed.data.variantId);
    if (notified > 0) return { ok: true, message: `Saved — texted ${notified} waiting customer${notified === 1 ? "" : "s"}` };
  }
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

const refundSchema = z.object({
  orderId: z.string().uuid(),
  amountGhs: z.coerce.number().positive("Enter an amount greater than zero").max(1_000_000),
  reason: z.string().trim().min(3, "Add a short reason").max(300),
});

export async function refundOrderAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = refundSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  try {
    const result = await refundOrder({
      orderId: parsed.data.orderId,
      amountPesewas: Math.round(parsed.data.amountGhs * 100),
      reason: parsed.data.reason,
      actor: "ADMIN",
    });
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);
    return { ok: true, message: `Refunded GHS ${(result.amount / 100).toFixed(2)}` };
  } catch (error) {
    if (error instanceof RefundError) return { ok: false, message: error.message };
    console.error("Refund failed:", error);
    return { ok: false, message: error instanceof Error ? error.message : "Refund failed" };
  }
}

export async function setCustomerBlockedAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const phone = normalizeGhanaPhone(String(formData.get("phone") ?? ""));
  const block = formData.get("block") === "true";
  const orderId = String(formData.get("orderId") ?? "");
  if (!phone) return { ok: false, message: "Invalid phone number" };

  await prisma.customer.upsert({
    where: { phone },
    update: block
      ? { isBlacklisted: true, blockReason: "Blocked by admin" }
      : { isBlacklisted: false, blockReason: null, noShowCount: 0 },
    create: { phone, name: "Unknown", isBlacklisted: block, blockReason: block ? "Blocked by admin" : null },
  });
  if (orderId) revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: block ? "Cash on Delivery blocked for this number" : "Cash on Delivery allowed again" };
}
