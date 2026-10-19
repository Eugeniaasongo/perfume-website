"use client";

import { useSyncExternalStore } from "react";

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  productName: string;
  size: string;
  pricePesewas: number; // Display only — the server re-prices every order.
  imageUrl?: string | null;
  quantity: number;
}

export const MAX_QUANTITY_PER_LINE = 10;
const CART_STORAGE_KEY = "ryz_parfums_cart_v2";
const CART_EVENT = "cart_updated";
const EMPTY: CartItem[] = [];

let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;

function isCartItem(value: unknown): value is CartItem {
  const v = value as CartItem;
  return (
    typeof v === "object" &&
    v !== null &&
    typeof v.variantId === "string" &&
    typeof v.slug === "string" &&
    typeof v.productName === "string" &&
    typeof v.size === "string" &&
    Number.isInteger(v.pricePesewas) &&
    Number.isInteger(v.quantity) &&
    v.quantity > 0
  );
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw === cachedRaw) return cachedItems;
    cachedRaw = raw;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedItems = Array.isArray(parsed) ? parsed.filter(isCartItem) : EMPTY;
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or blocked; the in-memory view still updates below.
  }
  window.dispatchEvent(new Event(CART_EVENT));
}

export function addToCart(item: CartItem): void {
  const current = getCart();
  const existing = current.find((i) => i.variantId === item.variantId);
  const updated = existing
    ? current.map((i) =>
        i.variantId === item.variantId
          ? { ...i, quantity: Math.min(MAX_QUANTITY_PER_LINE, i.quantity + item.quantity) }
          : i
      )
    : [...current, { ...item, quantity: Math.min(MAX_QUANTITY_PER_LINE, item.quantity) }];
  saveCart(updated);
}

export function updateCartQuantity(variantId: string, quantity: number): void {
  const current = getCart();
  const updated =
    quantity <= 0
      ? current.filter((i) => i.variantId !== variantId)
      : current.map((i) =>
          i.variantId === variantId ? { ...i, quantity: Math.min(MAX_QUANTITY_PER_LINE, quantity) } : i
        );
  saveCart(updated);
}

export function clearCart(): void {
  saveCart([]);
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === CART_STORAGE_KEY) onChange();
  };
  window.addEventListener(CART_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CART_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Reactive cart state. Returns an empty cart during SSR and the first client render. */
export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, getCart, () => EMPTY);
}

export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
