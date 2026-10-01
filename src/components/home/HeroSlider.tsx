"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgGradient: string;
  bottleLabel: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "LUXURY REDEFINED IN ACCRA",
    subtitle: "High-concentration Extraits de Parfum crafted for all-day radiance",
    ctaText: "SHOP THE SIGNATURE COLLECTION",
    ctaLink: "/collections/ryz-parfums",
    bgGradient: "from-neutral-950 via-brand-amber to-black",
    bottleLabel: "ROYAL OUD EXTRAIT",
  },
  {
    id: 2,
    title: "INSPIRED BY NICHE & DESIGNER SCENTS",
    subtitle: "Your favourite world-class fragrances without the luxury markup",
    ctaText: "DISCOVER INSPIRATIONS",
    ctaLink: "/collections/men",
    bgGradient: "from-stone-900 via-neutral-900 to-black",
    bottleLabel: "AMBER NECTAR",
  },
  {
    id: 3,
    title: "CASH ON DELIVERY NATIONWIDE",
    subtitle: "Order now and pay securely upon receipt across Ghana",
    ctaText: "ORDER WITH COD NOW",
    ctaLink: "/collections/women",
    bgGradient: "from-brand-amber via-stone-950 to-black",
    bottleLabel: "VELVET ROSE",
  },
  {
    id: 4,
    title: "DISCOVERY & SAMPLE SETS",
    subtitle: "Sample our top 5 bestsellers in 10ml travel atomizers",
    ctaText: "EXPLORE SAMPLE SETS",
    ctaLink: "/collections/sample-sets",
    bgGradient: "from-black via-neutral-900 to-brand-amber",
    bottleLabel: "DISCOVERY VAULT",
  },
  {
    id: 5,
    title: "SIGNATURE UNISEX FRAGRANCES",
    subtitle: "Captivating notes designed to turn heads everywhere you step",
    ctaText: "SHOP UNISEX SCENTS",
    ctaLink: "/collections/unisex",
    bgGradient: "from-stone-950 via-brand-amber/80 to-black",
    bottleLabel: "EMPEROR EDP",
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <section
      className="relative w-full h-[480px] md:h-[580px] overflow-hidden bg-black text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out bg-gradient-to-r ${
            slide.bgGradient
          } ${index === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-gold/15 via-transparent to-transparent opacity-60" />

          <div className="relative max-w-7xl mx-auto h-full px-6 flex flex-col md:flex-row items-center justify-between gap-8 z-20">
            <div className="max-w-xl text-center md:text-left pt-12 md:pt-0">
              <span className="inline-block text-brand-gold text-xs uppercase tracking-[0.3em] font-semibold mb-3 border-b border-brand-gold/40 pb-1">
                Ghanaian Fragrance House
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-wider leading-tight mb-4 text-white">
                {slide.title}
              </h1>
              <p className="text-neutral-300 text-sm md:text-base font-light mb-8 max-w-md">
                {slide.subtitle}
              </p>
              <div>
                <Link
                  href={slide.ctaLink}
                  className="inline-block bg-brand-gold text-black px-8 py-3.5 text-xs font-bold tracking-[0.2em] uppercase hover:bg-brand-gold-light transition-colors shadow-lg"
                >
                  {slide.ctaText}
                </Link>
              </div>
            </div>

            <div className="flex-1 flex justify-center items-center pb-8 md:pb-0">
              <div className="relative w-56 h-72 md:w-64 md:h-80 border border-brand-gold/40 bg-gradient-to-b from-neutral-900 to-black p-6 flex flex-col justify-between items-center shadow-2xl rounded-none">
                <div className="w-12 h-12 rounded-full border border-brand-gold/60 flex items-center justify-center text-brand-gold font-bold text-xs tracking-widest">
                  RYZ
                </div>
                <div className="text-center space-y-2">
                  <span className="text-brand-gold text-[10px] tracking-[0.3em] uppercase block">
                    Extrait de Parfum
                  </span>
                  <p className="text-white text-lg font-bold tracking-widest uppercase">
                    {slide.bottleLabel}
                  </p>
                  <span className="text-neutral-400 text-xs">100ml / 3.4 fl.oz</span>
                </div>
                <div className="w-full border-t border-brand-gold/30 pt-2 text-center text-[9px] tracking-widest text-brand-gold uppercase font-semibold">
                  Long-Lasting Formula
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/40 text-white hover:bg-brand-gold hover:text-black transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/40 text-white hover:bg-brand-gold hover:text-black transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === current ? "bg-brand-gold w-8" : "bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
