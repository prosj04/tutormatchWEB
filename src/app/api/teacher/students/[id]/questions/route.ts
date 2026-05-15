import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isValidDateString } from "@/lib/student-auth";
import { requireTeacherStudentMatch } from "@/lib/teacher-student-match";
import { requireTeacher } from "@/lib/teacher-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id: studentId } = await context.params;

  const matchResult = await requireTeacherStudentMatch(teacher.id, studentId);
  if ("error" in matchResult) return matchResult.error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const where: { studentId: string; date?: string } = { studentId };
  if (date) {
    if (!isValidDateString(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    where.date = date;
  }

  const questions = await prisma.question.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ questions });
}
