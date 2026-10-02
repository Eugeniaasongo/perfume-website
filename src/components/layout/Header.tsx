"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { getCart } from "@/lib/cart";

export const Header: React.FC = () => {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const cart = getCart();
      const total = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    };

    updateCount();
    window.addEventListener("cart_updated", updateCount);
    return () => window.removeEventListener("cart_updated", updateCount);
  }, []);

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left: Divider line & Navigation */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:block h-8 w-[1px] bg-neutral-200" />
          <nav className="hidden md:flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-neutral-800">
            <Link href="/" className="hover:text-brand-gold transition-colors">
              Home
            </Link>
            <span className="text-neutral-300">|</span>
            <Link href="/collections/men" className="hover:text-brand-gold transition-colors">
              Men
            </Link>
            <span className="text-neutral-300">|</span>
            <Link href="/collections/women" className="hover:text-brand-gold transition-colors">
              Women
            </Link>
            <span className="text-neutral-300">|</span>
            <Link href="/collections/ryz-parfums" className="hover:text-brand-gold transition-colors">
              RYZ Parfums
            </Link>
            <span className="text-neutral-300">|</span>
            <Link href="/tracking" className="hover:text-brand-gold transition-colors">
              Track Order
            </Link>
          </nav>
        </div>

        {/* Center: RYZ Parfums Gold Logo */}
        <Link href="/" className="flex flex-col items-center group">
          {/* Gold Crown Symbol */}
          <div className="text-brand-gold text-lg tracking-widest leading-none mb-0.5">
            👑
          </div>
          <span className="text-2xl font-black tracking-[0.3em] text-brand-gold font-sans leading-tight">
            RYZ
          </span>
          <span className="text-[9px] font-bold tracking-[0.4em] text-neutral-800 uppercase">
            P A R F U M S
          </span>
        </Link>

        {/* Right: Shopping Cart Icon & COD Trust Message */}
        <div className="flex items-center gap-6">
          {/* Trust Message Badge */}
          <div className="hidden xl:flex flex-col text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-black bg-neutral-100 px-2.5 py-1 border border-neutral-300/80">
              CASH ON DELIVERY ACCEPTED
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/search" aria-label="Search Catalog" className="text-neutral-800 hover:text-brand-gold transition-colors">
              <Search size={20} />
            </Link>

            <Link href="/cart" className="relative text-neutral-800 hover:text-brand-gold transition-colors p-1" aria-label="View Shopping Cart">
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
