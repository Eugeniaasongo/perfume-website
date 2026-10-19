import Link from "next/link";
import { ArrowRight, Droplets, ShieldCheck, Truck } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductCard";
import { BottleArt } from "@/components/ui/BottleArt";
import { getCatalogProducts } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

const promises = [
  {
    icon: Droplets,
    title: "Extrait concentration",
    body: "Up to 30% perfume oil for scents that last from morning meetings to late dinners.",
  },
  {
    icon: ShieldCheck,
    title: "Pay on delivery",
    body: "Verify your number, then pay in cash or MoMo when your order arrives. No risk.",
  },
  {
    icon: Truck,
    title: "Nationwide delivery",
    body: "Accra in 1–2 days, every other region in 2–4. Free on orders over GHS 500.",
  },
];

const categories = [
  { href: "/collections/men", title: "For Him", category: "Men", slug: "cat-men", label: "Woods" },
  { href: "/collections/women", title: "For Her", category: "Women", slug: "cat-women", label: "Rose" },
  { href: "/collections/unisex", title: "Unisex", category: "Unisex", slug: "cat-unisex", label: "Amber" },
];

export default async function HomePage() {
  const products = await getCatalogProducts({ limit: 8 });
  const hero = products[0];

  return (
    <>
      <section className="relative overflow-hidden bg-brand-amber text-ivory">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(184,146,58,0.35),transparent_60%)]" />
        <div className="container-page relative grid min-h-[560px] items-center gap-10 py-16 md:grid-cols-2 md:py-20 lg:min-h-[640px]">
          <div className="max-w-xl animate-fade-up">
            <p className="eyebrow text-brand-gold">Ghanaian fragrance house</p>
            <h1 className="mt-5 font-display text-5xl font-medium leading-[1.02] sm:text-6xl lg:text-7xl">
              Luxury that <em className="text-brand-gold">lingers.</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ivory/75">
              High-concentration extraits inspired by the world&apos;s most coveted scents — crafted in Accra,
              priced for everyday wear, and delivered to your door.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/collections/all" className="btn-gold">
                Shop the collection <ArrowRight size={14} />
              </Link>
              <Link href="#how-it-works" className="btn-ghost-light">
                How Cash on Delivery works
              </Link>
            </div>
          </div>

          {hero && (
            <Link
              href={`/products/${hero.slug}`}
              className="group relative mx-auto aspect-[4/5] w-full max-w-[360px]"
              aria-label={`Featured: ${hero.title}`}
            >
              <div className="absolute inset-6 rounded-full bg-brand-gold/20 blur-3xl" />
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]">
                <BottleArt
                  title={hero.title}
                  slug={hero.slug}
                  category={hero.category}
                  concentration={hero.concentration}
                  imageUrl={hero.imageUrl}
                  size="lg"
                  priority
                />
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] uppercase tracking-label text-ivory/60">
                Featured · {hero.title}
              </span>
            </Link>
          )}
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="container-page grid gap-8 py-10 md:grid-cols-3">
          {promises.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <Icon size={22} strokeWidth={1.25} className="mt-0.5 shrink-0 text-brand-gold-dark" />
              <div>
                <h2 className="text-sm font-medium text-ink">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-stone">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Bestsellers</p>
            <h2 className="heading-display mt-3 text-4xl">The signature edit</h2>
          </div>
          <Link href="/collections/all" className="hidden text-xs uppercase tracking-label text-ink hover:text-brand-gold-dark sm:inline-flex sm:items-center sm:gap-2">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <p className="py-16 text-center text-stone">New fragrances are on their way. Check back soon.</p>
        )}
      </section>

      <section className="container-page pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map((cat) => (
            <Link key={cat.href} href={cat.href} className="group relative block aspect-[4/5] overflow-hidden bg-sand md:aspect-[3/4]">
              <div className="absolute inset-0 opacity-90 transition-transform duration-700 group-hover:scale-105">
                <BottleArt title={cat.label} slug={cat.slug} category={cat.category} />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-6 pt-20 text-ivory">
                <h3 className="font-display text-3xl">{cat.title}</h3>
                <span className="mt-1 inline-flex items-center gap-2 text-xs uppercase tracking-label text-ivory/80">
                  Explore <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-sand">
        <div className="container-page py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Cash on Delivery</p>
            <h2 className="heading-display mt-3 text-4xl">Smell it first. Pay when it arrives.</h2>
          </div>
          <ol className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
            {[
              ["Choose your scent", "Add your fragrances to the bag and head to checkout."],
              ["Verify your number", "We text a one-time code to confirm your order is real."],
              ["Pay on delivery", "Pay our rider in cash or MoMo when your parcel arrives."],
            ].map(([title, body], i) => (
              <li key={title} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-gold font-display text-xl text-brand-gold-dark">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-sm font-medium text-ink">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-stone">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
