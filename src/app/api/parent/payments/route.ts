import { NextResponse } from "next/server";

import { listParentPayments } from "@/lib/parent-data";
import { requireParent } from "@/lib/parent-page-auth";

/** GET /api/parent/payments — 연결 자녀별 결제·청구 이력(웹) */
export async function GET() {
  const authResult = await requireParent();
  if ("error" in authResult) return authResult.error;

  const groups = await listParentPayments(authResult.parent.id);
  return NextResponse.json({ children: groups });
}
