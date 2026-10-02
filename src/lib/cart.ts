"use client";

export interface CartItem {
  variantId: string; // SKU or UUID
  productId: string;
  productName: string;
  size: string;
  pricePesewas: number;
  imageUrl: string;
  quantity: number;
}

const CART_STORAGE_KEY = "ryz_parfums_cart_v1";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToCart(item: CartItem): CartItem[] {
  const current = getCart();
  const existingIdx = current.findIndex((i) => i.variantId === item.variantId);

  let updated: CartItem[];
  if (existingIdx > -1) {
    updated = [...current];
    updated[existingIdx].quantity += item.quantity;
  } else {
    updated = [...current, item];
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("cart_updated"));
  }
  return updated;
}

export function updateCartQuantity(variantId: string, quantity: number): CartItem[] {
  const current = getCart();
  let updated: CartItem[];
  if (quantity <= 0) {
    updated = current.filter((i) => i.variantId !== variantId);
  } else {
    updated = current.map((i) => (i.variantId === variantId ? { ...i, quantity } : i));
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("cart_updated"));
  }
  return updated;
}

export function clearCart(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new Event("cart_updated"));
  }
}
