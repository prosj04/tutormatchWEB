import { NextResponse } from "next/server";

import { getStudentQuestion, setResolved } from "@/lib/qna";
import { requireStudent } from "@/lib/student-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { id } = await context.params;
  const existing = await getStudentQuestion(id, student.id);
  if (!existing) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  let body: { isResolved?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.isResolved !== "boolean") {
    return NextResponse.json({ error: "Invalid isResolved" }, { status: 400 });
  }

  await setResolved(id, student.id, body.isResolved);
  const question = await getStudentQuestion(id, student.id);

  return NextResponse.json({ question });
}
