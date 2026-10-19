export const SITE = {
  name: "RYZ Parfums",
  tagline: "Long-lasting luxury fragrances, crafted in Ghana",
  phoneDisplay: process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY || "+233 20 000 0000",
  phoneE164: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+233200000000",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@ryzparfums.com",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "233200000000").replace(/\D/g, ""),
};

export function whatsappLink(message: string) {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const NAV_LINKS = [
  { href: "/collections/all", label: "Shop All" },
  { href: "/collections/men", label: "For Him" },
  { href: "/collections/women", label: "For Her" },
  { href: "/collections/unisex", label: "Unisex" },
  { href: "/tracking", label: "Track Order" },
];
