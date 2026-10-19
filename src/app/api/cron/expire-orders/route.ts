import { NextResponse } from "next/server";
import { expireStalePendingOrders } from "@/lib/orders/state-machine";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expired = await expireStalePendingOrders();
  return NextResponse.json({ success: true, expired });
}
