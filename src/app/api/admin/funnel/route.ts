import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { getFunnelSnapshot } from "@/lib/analytics-funnel";

export async function GET(request: Request) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const rawDays = Number(searchParams.get("days") ?? "30");
  const days = Number.isFinite(rawDays) ? Math.min(90, Math.max(7, rawDays)) : 30;

  const funnel = await getFunnelSnapshot(days);
  return NextResponse.json({ funnel });
}
