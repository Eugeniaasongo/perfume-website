"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Crown, Menu, X, ShieldCheck } from "lucide-react";

export function Header({ cartCount = 0 }: { cartCount?: number }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Men", href: "/collections/men" },
    { name: "Women", href: "/collections/women" },
    { name: "Unisex", href: "/collections/unisex" },
    { name: "Makeup", href: "/collections/makeup" },
    { name: "RYZ Parfums", href: "/collections/ryz-parfums" },
    { name: "Sample Sets", href: "/collections/sample-sets" },
  ];

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-black p-1 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="hidden md:block w-px h-10 bg-neutral-200" />

        <Link href="/" className="flex flex-col items-center group">
          <Crown size={22} className="text-brand-gold mb-1 group-hover:scale-105 transition-transform" />
          <span className="text-2xl md:text-3xl font-extrabold tracking-[0.25em] text-black">
            RYZ
          </span>
          <span className="text-[10px] tracking-[0.4em] text-neutral-600 font-medium -mt-1">
            P A R F U M S
          </span>
        </Link>

        <div className="hidden md:block w-px h-10 bg-neutral-200" />

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 bg-neutral-100 border border-brand-gold/30 px-3 py-1.5 text-xs font-bold tracking-wider text-brand-gold-dark rounded-none">
            <ShieldCheck size={16} className="text-brand-gold" />
            <span>CASH ON DELIVERY ACCEPTED</span>
          </div>

          <Link
            href="/cart"
            className="relative p-2 text-black hover:text-brand-gold transition-colors flex items-center"
            aria-label={`Shopping bag with ${cartCount} items`}
          >
            <ShoppingBag size={24} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="sm:hidden bg-neutral-900 text-white py-1.5 text-center text-[11px] font-bold tracking-widest flex items-center justify-center gap-1">
        <ShieldCheck size={14} className="text-brand-gold" />
        <span>CASH ON DELIVERY ACCEPTED NATIONWIDE</span>
      </div>

      <nav className="hidden md:flex justify-center items-center py-2 border-t border-neutral-100 bg-neutral-50/50 text-xs font-semibold uppercase tracking-widest">
        <div className="flex items-center space-x-6">
          {navLinks.map((link, idx) => (
            <React.Fragment key={link.name}>
              <Link
                href={link.href}
                className="hover:text-brand-gold transition-colors text-black"
              >
                {link.name}
              </Link>
              {idx < navLinks.length - 1 && (
                <span className="text-neutral-300 font-light">|</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-200 px-4 py-4 space-y-3 uppercase text-xs tracking-widest font-semibold">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 border-b border-neutral-100 text-black hover:text-brand-gold"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
