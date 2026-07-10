import { NextResponse } from "next/server";

import { listParentChildren } from "@/lib/parent-data";
import { requireParent } from "@/lib/parent-page-auth";

/** GET /api/parent/children — 연결된 자녀 목록·요약(웹) */
export async function GET() {
  const authResult = await requireParent();
  if ("error" in authResult) return authResult.error;

  const children = await listParentChildren(authResult.parent.id);
  return NextResponse.json({ children });
}
