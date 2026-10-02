import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/services/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";

  try {
    const products = await getCatalogProducts({
      query: q,
      category: category,
    });
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search catalog" },
      { status: 500 }
    );
  }
}
