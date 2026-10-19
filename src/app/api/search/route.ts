import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/services/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").slice(0, 100);
  const category = (searchParams.get("category") || "").slice(0, 40) || undefined;

  try {
    const products = await getCatalogProducts({ query: q, category, limit: 24 });
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to search catalog" }, { status: 500 });
  }
}
