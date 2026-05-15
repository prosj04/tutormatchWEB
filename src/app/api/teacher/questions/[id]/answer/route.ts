import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireTeacherStudentMatch } from "@/lib/teacher-student-match";
import { requireTeacher } from "@/lib/teacher-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id } = await context.params;

  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const matchResult = await requireTeacherStudentMatch(teacher.id, question.studentId);
  if ("error" in matchResult) return matchResult.error;

  let body: { teacherAnswer?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.teacherAnswer !== "string" || !body.teacherAnswer.trim()) {
    return NextResponse.json({ error: "Answer is required" }, { status: 400 });
  }

  const updated = await prisma.question.update({
    where: { id },
    data: {
      teacherAnswer: body.teacherAnswer.trim(),
      teacherAnswerAt: new Date(),
      answeredBy: teacher.id,
    },
  });

  return NextResponse.json({ question: updated });
}
