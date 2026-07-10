import { NextResponse } from "next/server";

import { requireMobileParent } from "@/lib/mobile-auth";
import { listParentChildren } from "@/lib/parent-data";

/** GET /api/mobile/parent/children — 연결된 자녀 목록·요약(모바일) */
export async function GET(request: Request) {
  const authResult = await requireMobileParent(request);
  if ("error" in authResult) return authResult.error;

  const children = await listParentChildren(authResult.parent.id);
  return NextResponse.json({ children });
}
