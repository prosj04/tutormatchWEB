import { NextResponse } from "next/server";

import { requireMobileTeacher } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { isValidDateString, isValidMonthString } from "@/lib/student-auth";
import { requireTeacherStudentMatch } from "@/lib/teacher-student-match";

type RouteContext = { params: Promise<{ id: string }> };

function addDays(date: string, offset: number) {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(year, month - 1, day + offset, 12, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function parseTemplateDays(value: string | null) {
  const parsed = Number(value);
  return parsed === 4 || parsed === 7 ? parsed : null;
}

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireMobileTeacher(request);
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id: studentId } = await context.params;

  const matchResult = await requireTeacherStudentMatch(teacher.id, studentId);
  if ("error" in matchResult) return matchResult.error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");
  const templateStart = searchParams.get("templateStart");
  const templateDays = parseTemplateDays(searchParams.get("templateDays"));

  if (templateStart || templateDays) {
    if (!templateStart || !templateDays || !isValidDateString(templateStart)) {
      return NextResponse.json({ error: "Invalid template range" }, { status: 400 });
    }

    const dates = Array.from({ length: templateDays }).map((_, index) =>
      addDays(templateStart, index),
    );
    const plans = await prisma.studyPlan.findMany({
      where: { studentId, date: { in: dates } },
      orderBy: { date: "asc" },
      include: { tasks: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({
      template: {
        startDate: templateStart,
        days: templateDays,
        dates,
        plans,
        tasks: plans.flatMap((plan) => plan.tasks.map((task) => task.title)),
      },
    });
  }

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
