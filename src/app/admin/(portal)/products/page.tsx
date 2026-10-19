import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { toggleProductActiveAction, updateVariantAction } from "../../actions";

export const metadata: Metadata = { title: "Products & stock" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { variants: { orderBy: { pricePesewas: "asc" } } },
    orderBy: { title: "asc" },
  });

  return (
    <>
      <PageHeader title="Products & stock" description="Update prices and stock levels. Changes are live immediately." />

      <div className="space-y-4">
        {products.map((product) => (
          <section key={product.id} className="rounded-lg border border-line bg-white">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
              <div>
                <h2 className="text-sm font-medium text-ink">
                  {product.title}{" "}
                  {!product.isActive && <span className="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-stone">Hidden</span>}
                </h2>
                <p className="text-xs text-stone">
                  {product.category} · {product.concentration}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Link href={`/products/${product.slug}`} target="_blank" className="text-stone hover:text-ink">
                  View
                </Link>
                <form action={toggleProductActiveAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <button className="rounded-md border border-line px-3 py-1.5 text-xs hover:border-ink">
                    {product.isActive ? "Hide from store" : "Show in store"}
                  </button>
                </form>
              </div>
            </header>
            <div className="divide-y divide-line">
              {product.variants.map((v) => (
                <ActionForm
                  key={v.id}
                  action={updateVariantAction}
                  submitLabel="Save"
                  submitClassName="rounded-md border border-line px-3 py-1.5 text-xs hover:border-ink disabled:opacity-50"
                  className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
                >
                  <input type="hidden" name="variantId" value={v.id} />
                  <span className="w-16 font-medium">{v.size}</span>
                  <span className="w-32 text-xs text-stone">{v.sku}</span>
                  <label className="flex items-center gap-2 text-xs text-stone">
                    GHS
                    <input
                      name="priceGhs"
                      type="number"
                      step="0.01"
                      min="0.01"
                      defaultValue={(v.pricePesewas / 100).toFixed(2)}
                      className="field-input w-28 rounded-md py-1.5"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-stone">
                    Stock
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={v.stock}
                      className={`field-input w-24 rounded-md py-1.5 ${v.stock === 0 ? "border-red-300" : v.stock <= 5 ? "border-orange-300" : ""}`}
                    />
                  </label>
                </ActionForm>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
