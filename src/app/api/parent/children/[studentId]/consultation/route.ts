import { NextResponse } from "next/server";

import { requestChildConsultation } from "@/lib/parent-data";
import { parentOwnsStudent, requireParent } from "@/lib/parent-page-auth";

type RouteContext = { params: Promise<{ studentId: string }> };

/** POST /api/parent/children/[studentId]/consultation — 자녀 상담 신청(웹) */
export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireParent();
  if ("error" in authResult) return authResult.error;

  const { studentId } = await context.params;
  if (!(await parentOwnsStudent(authResult.parent.id, studentId))) {
    return NextResponse.json({ error: "연결되지 않은 자녀입니다." }, { status: 403 });
  }

  let body: { note?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const note = typeof body.note === "string" ? body.note.slice(0, 2000) : "";

  const result = await requestChildConsultation(studentId, note);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, status: result.status, alreadyOpen: result.alreadyOpen });
}
