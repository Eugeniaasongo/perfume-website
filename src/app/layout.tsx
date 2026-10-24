import type { Metadata, Viewport } from "next";
// Self-hosted fonts so builds never depend on fetching from Google Fonts.
import "@fontsource-variable/jost/wght.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/cormorant-garamond/latin-500-italic.css";
import "@/app/globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DHA Perfumes | Long-Lasting Luxury Fragrances in Ghana",
    template: "%s | DHA Perfumes",
  },
  description:
    "Ghanaian fragrance house crafting high-concentration Extraits de Parfum inspired by iconic designer and niche scents. Cash on Delivery nationwide.",
  openGraph: {
    type: "website",
    siteName: "DHA Perfumes",
    locale: "en_GH",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E0D0B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
