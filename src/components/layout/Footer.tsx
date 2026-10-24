import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { SITE, whatsappLink } from "@/lib/site";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/collections/all", label: "All Fragrances" },
      { href: "/collections/men", label: "For Him" },
      { href: "/collections/women", label: "For Her" },
      { href: "/collections/unisex", label: "Unisex" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/tracking", label: "Track Your Order" },
      { href: "/terms#delivery", label: "Delivery & Cash on Delivery" },
      { href: "/terms#returns", label: "Returns" },
      { href: "/terms#privacy", label: "Privacy Policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-ivory">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-4">
          <Logo tone="light" className="items-start" />
          <p className="max-w-xs text-sm leading-relaxed text-ivory/60">
            A Ghanaian fragrance house making high-concentration extraits that last all day — without the
            designer markup.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="mb-4 text-[11px] uppercase tracking-label text-brand-gold">{col.title}</h2>
            <ul className="space-y-2.5 text-sm text-ivory/70">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition-colors hover:text-ivory">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="mb-4 text-[11px] uppercase tracking-label text-brand-gold">Contact</h2>
          <ul className="space-y-2.5 text-sm text-ivory/70">
            <li>
              <a href={`tel:${SITE.phoneE164}`} className="hover:text-ivory">
                {SITE.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="hover:text-ivory">
                {SITE.email}
              </a>
            </li>
            <li>
              <a
                href={whatsappLink("Hi RYZ Parfums, I have a question")}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ivory"
              >
                WhatsApp us
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-page flex flex-col gap-3 py-6 text-[11px] text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} RYZ Parfums. All rights reserved.</p>
          <p>
            RYZ Parfums is not affiliated with the brands referenced as inspiration.{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-ivory/70">
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
