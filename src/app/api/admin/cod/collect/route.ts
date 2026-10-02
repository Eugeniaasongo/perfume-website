import { NextResponse } from "next/server";
import { recordCodCashCollection } from "@/lib/cod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, collectedAmountPesewas, collectorName, notes } = body;

    if (!orderId || !collectedAmountPesewas || !collectorName) {
      return NextResponse.json(
        { error: "Missing required fields for cash collection" },
        { status: 400 }
      );
    }

    const result = await recordCodCashCollection({
      orderId,
      collectedAmountPesewas: Number(collectedAmountPesewas),
      collectorName,
      notes,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Admin COD Collection Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
