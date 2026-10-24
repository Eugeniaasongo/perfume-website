import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeGhanaPhone } from "@/lib/phone";
import { jsonError, readJson, zodErrorResponse } from "@/lib/api";

const schema = z.object({
  variantId: z.string().uuid(),
  phone: z.string().max(30),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const phone = normalizeGhanaPhone(parsed.data.phone);
  if (!phone) return jsonError("Enter a valid Ghana mobile number", 400, { phone: "Enter a valid Ghana mobile number" });

  const variant = await prisma.productVariant.findUnique({
    where: { id: parsed.data.variantId },
    select: { stock: true, product: { select: { isActive: true } } },
  });
  if (!variant || !variant.product.isActive) return jsonError("This fragrance is no longer available", 404);
  if (variant.stock > 0) return jsonError("Good news — this size is in stock now", 409);

  await prisma.backInStockSubscriber.upsert({
    where: { variantId_phone: { variantId: parsed.data.variantId, phone } },
    update: { notifiedAt: null },
    create: { variantId: parsed.data.variantId, phone },
  });

  return NextResponse.json({ success: true });
}
