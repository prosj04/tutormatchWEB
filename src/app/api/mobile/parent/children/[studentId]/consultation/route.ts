import { NextResponse } from "next/server";

import { parentChildOrNull, requireMobileParent } from "@/lib/mobile-auth";
import { requestChildConsultation } from "@/lib/parent-data";

type RouteContext = { params: Promise<{ studentId: string }> };

/** POST /api/mobile/parent/children/[studentId]/consultation — 자녀 상담 신청(모바일) */
export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireMobileParent(request);
  if ("error" in authResult) return authResult.error;

  const { studentId } = await context.params;
  if (!(await parentChildOrNull(authResult.parent.id, studentId))) {
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
