import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { exportOrdersCsv } from "@/lib/reports";

export async function GET(request: Request) {
  // Middleware already guards /api/admin; check again so this never depends on one layer.
  if (!(await verifySessionToken((await cookies()).get(ADMIN_SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = Math.min(366, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const csv = await exportOrdersCsv(since);

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ryz-orders-last-${days}-days.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
