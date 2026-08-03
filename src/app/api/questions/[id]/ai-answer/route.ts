import { NextResponse } from "next/server";

import { resolveAiAnswer } from "@/lib/qna-ai-answer";
import { requireStudent } from "@/lib/student-auth";

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/questions/[id]/ai-answer — 질문에 AI 초안 답변 생성(웹). */
export async function POST(_request: Request, context: RouteContext) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { id } = await context.params;
  const result = await resolveAiAnswer(student.id, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ aiAnswer: result.aiAnswer });
}
