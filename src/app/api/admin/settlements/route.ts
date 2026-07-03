import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { computeMonthlySettlement } from "@/lib/settlement";

/**
 * GET /api/admin/settlements?year=2026&month=6
 *
 * Returns the monthly teacher settlement report for the given KST month.
 * Defaults to the previous KST month when year/month are omitted or invalid.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  // Derive default = previous KST month
  // Shift now by +9h so UTC month/year extraction equals KST month/year
  const nowKst = new Date(Date.now() + 9 * 3600 * 1000);
  let defaultYear = nowKst.getUTCFullYear();
  let defaultMonth = nowKst.getUTCMonth(); // 0-based; this is already "previous month" of the current KST month
  if (defaultMonth === 0) {
    defaultYear -= 1;
    defaultMonth = 12;
  }
  // defaultMonth is now 1-based previous month (0-based getUTCMonth → 1-based current month - 1)

  const { searchParams } = req.nextUrl;
  const rawYear = searchParams.get("year");
  const rawMonth = searchParams.get("month");

  let year = rawYear ? parseInt(rawYear, 10) : defaultYear;
  let month = rawMonth ? parseInt(rawMonth, 10) : defaultMonth;

  // Validate; fall back to default on invalid values
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    year < 2020 ||
    year > 2100
  ) {
    year = defaultYear;
    month = defaultMonth;
  }

  const result = await computeMonthlySettlement(year, month);

  return NextResponse.json(result);
}
