import { NextResponse } from "next/server";

import { listChildReports } from "@/lib/parent-data";
import { parentOwnsStudent, requireParent } from "@/lib/parent-page-auth";

type RouteContext = { params: Promise<{ studentId: string }> };

/** GET /api/parent/children/[studentId]/reports — 자녀 리포트(웹, 읽기) */
export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireParent();
  if ("error" in authResult) return authResult.error;

  const { studentId } = await context.params;
  if (!(await parentOwnsStudent(authResult.parent.id, studentId))) {
    return NextResponse.json({ error: "연결되지 않은 자녀입니다." }, { status: 403 });
  }

  const reports = await listChildReports(studentId);
  return NextResponse.json({ reports });
}
