import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/teacher-auth";
import { confirmLesson, parseConfirmInput } from "@/lib/lesson-confirm";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/teacher/lessons/[id]/confirm
 *  수업 확인 제도 — 종료된 수업을 선생님이 확인 처리한다.
 *  body: { outcome: "COMPLETED" }
 *      | { outcome: "NOT_HELD", fault: "STUDENT" | "NOT_STUDENT", reason: string }
 *  NOT_HELD + NOT_STUDENT면 원 수업 CANCELLED + 대체 수업 자동 생성(이월).
 */
export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher, userId } = authResult;

  const { id } = await context.params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const parsed = parseConfirmInput(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await confirmLesson(id, teacher.id, userId, parsed.input);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    resolvedStatus: result.resolvedStatus,
    makeup: result.makeup,
    makeupCreated: result.makeup !== null,
    makeupSkippedReason: result.makeupSkippedReason,
  });
}
