import React from "react";
import "@/app/globals.css";

export const metadata = {
  title: "RYZ Parfums | Long-Lasting Luxury Fragrances in Ghana",
  description:
    "Ghanaian-owned luxury fragrance house crafting high-concentration Extraits de Parfum inspired by top designer and niche scents. Cash on Delivery accepted nationwide.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">{children}</body>
    </html>
  );
}
