"use client";

import React, { useState } from "react";
import { Phone, Mail, Search, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

export function UtilityBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-black text-white py-2 px-4 text-xs font-light tracking-wide border-b border-neutral-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex items-center space-x-4 flex-wrap justify-center md:justify-start">
          <a
            href="tel:+233200000000"
            className="flex items-center gap-1 hover:text-brand-gold transition-colors"
          >
            <Phone size={13} className="text-brand-gold" />
            <span>+233 20 000 0000</span>
          </a>
          <span className="text-neutral-600">|</span>
          <a
            href="mailto:support@ryzparfums.com"
            className="flex items-center gap-1 hover:text-brand-gold transition-colors"
          >
            <Mail size={13} className="text-brand-gold" />
            <span>support@ryzparfums.com</span>
          </a>
          <span className="text-neutral-600">|</span>
          <a
            href="https://wa.me/233200000000?text=Hi%20RYZ%20Parfums%2C%20I%20have%20an%20inquiry"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            <MessageSquare size={13} />
            <span>WhatsApp Us</span>
          </a>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search scents or inspired designer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-black text-xs py-1 pl-3 pr-8 rounded-none border border-neutral-300 focus:outline-none focus:border-brand-gold transition-colors placeholder:text-neutral-500"
          />
          <button
            type="submit"
            aria-label="Submit search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-black hover:text-brand-gold"
          >
            <Search size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
