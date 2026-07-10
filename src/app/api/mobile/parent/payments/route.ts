import { NextResponse } from "next/server";

import { requireMobileParent } from "@/lib/mobile-auth";
import { listParentPayments } from "@/lib/parent-data";

/** GET /api/mobile/parent/payments — 연결 자녀별 결제·청구 이력(모바일) */
export async function GET(request: Request) {
  const authResult = await requireMobileParent(request);
  if ("error" in authResult) return authResult.error;

  const groups = await listParentPayments(authResult.parent.id);
  return NextResponse.json({ children: groups });
}
