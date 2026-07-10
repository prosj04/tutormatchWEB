import { NextResponse } from "next/server";

import { parentChildOrNull, requireMobileParent } from "@/lib/mobile-auth";
import { listChildReports } from "@/lib/parent-data";

type RouteContext = { params: Promise<{ studentId: string }> };

/** GET /api/mobile/parent/children/[studentId]/reports — 자녀 리포트(모바일, 읽기) */
export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireMobileParent(request);
  if ("error" in authResult) return authResult.error;

  const { studentId } = await context.params;
  if (!(await parentChildOrNull(authResult.parent.id, studentId))) {
    return NextResponse.json({ error: "연결되지 않은 자녀입니다." }, { status: 403 });
  }

  const reports = await listChildReports(studentId);
  return NextResponse.json({ reports });
}
