import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatGhs } from "@/lib/format";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { addVariantAction, deleteVariantAction, saveProductAction } from "../../../catalog-actions";

export const metadata: Metadata = { title: "Edit product" };

const input = "field-input mt-1 rounded-md py-2";
const label = "block text-xs text-stone";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const product = isNew
    ? null
    : await prisma.product.findUnique({
        where: { id },
        include: {
          variants: {
            orderBy: { pricePesewas: "asc" },
            include: { _count: { select: { orderItems: true } } },
          },
        },
      });
  if (!isNew && !product) notFound();

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1 text-sm text-stone hover:text-ink">
        <ArrowLeft size={14} /> Products
      </Link>
      <PageHeader title={product ? product.title : "New product"}>
        {product && (
          <Link href={`/products/${product.slug}`} target="_blank" className="text-sm text-stone hover:text-ink">
            View in store
          </Link>
        )}
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel title="Details">
          <ActionForm action={saveProductAction} submitLabel={isNew ? "Create product" : "Save changes"} className="space-y-4">
            <input type="hidden" name="id" value={product?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Name
                <input name="title" required defaultValue={product?.title} className={input} />
              </label>
              <label className={label}>
                URL name (leave blank to generate)
                <input name="slug" defaultValue={product?.slug} placeholder="royal-oud-extrait" className={input} />
              </label>
            </div>
            <label className={label}>
              Description
              <textarea name="description" required rows={3} defaultValue={product?.description} className={input} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Collection
                <select name="category" defaultValue={product?.category ?? "Unisex"} className={input}>
                  <option value="Men">For Him</option>
                  <option value="Women">For Her</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </label>
              <label className={label}>
                Concentration
                <input name="concentration" required defaultValue={product?.concentration ?? "Extrait de Parfum"} className={input} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className={label}>
                Top notes (comma separated)
                <input name="topNotes" defaultValue={product?.topNotes} className={input} />
              </label>
              <label className={label}>
                Heart notes
                <input name="heartNotes" defaultValue={product?.heartNotes} className={input} />
              </label>
              <label className={label}>
                Base notes
                <input name="baseNotes" defaultValue={product?.baseNotes} className={input} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Longevity (1–5)
                <input name="longevityRating" type="number" min={1} max={5} defaultValue={product?.longevityRating ?? 5} className={input} />
              </label>
              <label className={label}>
                Projection (1–5)
                <input name="sillageRating" type="number" min={1} max={5} defaultValue={product?.sillageRating ?? 4} className={input} />
              </label>
            </div>
            <label className={label}>
              Photo URL (optional — Cloudinary, Vercel Blob or Unsplash)
              <input name="imageUrl" type="url" defaultValue={product?.imageUrl ?? ""} className={input} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Inspired by — house
                <input name="inspiredHouse" defaultValue={product?.inspiredHouse ?? ""} className={input} />
              </label>
              <label className={label}>
                Inspired by — fragrance
                <input name="inspiredName" defaultValue={product?.inspiredName ?? ""} className={input} />
              </label>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} className="accent-ink" />
                Visible in store
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured ?? false} className="accent-ink" />
                Featured on home page
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="inspiredEnabled" defaultChecked={product?.inspiredEnabled ?? true} className="accent-ink" />
                Show “inspired by” label
              </label>
            </div>
          </ActionForm>
        </Panel>

        {product ? (
          <Panel title="Sizes">
            <ul className="mb-5 divide-y divide-line text-sm">
              {product.variants.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span>
                    {v.size} · {formatGhs(v.pricePesewas)}
                    <span className="block text-xs text-stone">
                      {v.sku} · {v.stock} in stock
                    </span>
                  </span>
                  {v._count.orderItems === 0 && (
                    <ActionForm
                      action={deleteVariantAction}
                      submitLabel="Delete"
                      confirm={`Delete the ${v.size} size?`}
                      submitClassName="text-xs text-red-700 hover:underline"
                    >
                      <input type="hidden" name="variantId" value={v.id} />
                    </ActionForm>
                  )}
                </li>
              ))}
              {product.variants.length === 0 && (
                <li className="py-2 text-orange-700">Add at least one size — products without sizes aren&apos;t shown.</li>
              )}
            </ul>
            <p className="mb-2 text-xs font-medium text-ink">Add a size</p>
            <ActionForm action={addVariantAction} submitLabel="Add size" resetOnSuccess className="grid grid-cols-2 gap-3">
              <input type="hidden" name="productId" value={product.id} />
              <label className={label}>
                Size
                <input name="size" required placeholder="50ml" className={input} />
              </label>
              <label className={label}>
                SKU
                <input name="sku" required placeholder="RYZ-XX-50ML" className={`${input} uppercase`} />
              </label>
              <label className={label}>
                Price (GHS)
                <input name="priceGhs" type="number" step="0.01" min="0.01" required className={input} />
              </label>
              <label className={label}>
                Stock
                <input name="stock" type="number" min="0" defaultValue={0} required className={input} />
              </label>
            </ActionForm>
            <p className="mt-4 text-xs text-stone">Change prices and stock on the Products & stock page.</p>
          </Panel>
        ) : (
          <Panel title="Sizes">
            <p className="text-sm text-stone">Save the product first, then add its sizes here.</p>
          </Panel>
        )}
      </div>
    </>
  );
}
