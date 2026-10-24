"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useCart, useIsHydrated } from "@/lib/cart";
import { NAV_LINKS } from "@/lib/site";

export function Header() {
  const items = useCart();
  const hydrated = useIsHydrated();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/85">
      <div className="container-page grid h-[72px] grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center">
          <button
            onClick={() => setMenuOpen(true)}
            className="-ml-2 p-2 lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.slice(0, 4).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[12px] uppercase tracking-label transition-colors hover:text-brand-gold-dark ${
                  pathname === link.href ? "text-brand-gold-dark" : "text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Logo />

        <div className="flex items-center justify-end gap-1 sm:gap-3">
          <Link
            href="/tracking"
            className="hidden text-[12px] uppercase tracking-label text-ink transition-colors hover:text-brand-gold-dark lg:block"
          >
            Track Order
          </Link>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="p-2 transition-colors hover:text-brand-gold-dark"
            aria-label="Search"
            aria-expanded={searchOpen}
          >
            <Search size={20} strokeWidth={1.5} />
          </button>
          <Link
            href="/cart"
            className="relative -mr-2 p-2 transition-colors hover:text-brand-gold-dark"
            aria-label={`Cart${hydrated && cartCount ? `, ${cartCount} items` : ""}`}
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {hydrated && cartCount > 0 && (
              <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-semibold text-ink">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-line bg-ivory">
          <form onSubmit={submitSearch} className="container-page flex items-center gap-3 py-4" role="search">
            <Search size={18} strokeWidth={1.5} className="text-stone" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by scent, note or the fragrance it's inspired by…"
              className="flex-1 bg-transparent py-1 text-base placeholder:text-stone-light focus:outline-none"
              aria-label="Search fragrances"
            />
            <button type="submit" className="text-xs uppercase tracking-label text-brand-gold-dark">
              Search
            </button>
          </form>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-ivory shadow-2xl">
            <div className="flex h-[72px] items-center justify-between border-b border-line px-5">
              <Logo />
              <button onClick={() => setMenuOpen(false)} className="p-2" aria-label="Close menu">
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex flex-col px-5 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-b border-line py-4 font-display text-2xl text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="mt-auto px-5 pb-8 text-xs leading-relaxed text-stone">
              Pay on delivery anywhere in Ghana. Questions? Message us on WhatsApp.
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
