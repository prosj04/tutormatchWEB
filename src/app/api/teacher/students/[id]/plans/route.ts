import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isValidDateString, isValidMonthString } from "@/lib/student-auth";
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
  const month = searchParams.get("month");

  if (month) {
    if (!isValidMonthString(month)) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }
  }

  if (month && date) {
    if (!isValidDateString(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const [plans, plan] = await Promise.all([
      prisma.studyPlan.findMany({
        where: { studentId, date: { startsWith: month } },
        select: { date: true },
      }),
      prisma.studyPlan.findFirst({
        where: { studentId, date },
        include: { tasks: { orderBy: { order: "asc" } } },
      }),
    ]);

    return NextResponse.json({
      dates: plans.map((p) => p.date),
      plan,
    });
  }

  if (month) {
    const plans = await prisma.studyPlan.findMany({
      where: { studentId, date: { startsWith: month } },
      select: { date: true },
    });
    return NextResponse.json({ dates: plans.map((p) => p.date) });
  }

  if (date) {
    if (!isValidDateString(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const plan = await prisma.studyPlan.findFirst({
      where: { studentId, date },
      include: { tasks: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json({ plan });
  }

  const plans = await prisma.studyPlan.findMany({
    where: { studentId },
    orderBy: { date: "desc" },
    include: { tasks: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ plans });
}
