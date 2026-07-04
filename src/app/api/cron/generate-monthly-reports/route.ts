import { NextResponse } from "next/server";

import { authorizeCron } from "@/lib/cron-auth";
import {
  generateMonthlyReportsForMonth,
  getPreviousMonth,
} from "@/lib/generate-monthly-report";

export async function GET(request: Request) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? getPreviousMonth();

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month format" }, { status: 400 });
  }

  const result = await generateMonthlyReportsForMonth(month);
  return NextResponse.json({ month, ...result });
}
