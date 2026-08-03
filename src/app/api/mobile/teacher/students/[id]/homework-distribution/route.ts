import { NextResponse } from "next/server";

import { addDays, distributeTasks, parseTasks } from "@/lib/homework-distribution-core";
import { requireMobileTeacher } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { requireTeacherStudentMatch } from "@/lib/teacher-student-match";

type RouteContext = { params: Promise<{ id: string }> };

type RequestBody = {
  startDate?: unknown;
  days?: unknown;
  tasks?: unknown;
  repeatWeeks?: unknown;
};

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10);
}

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireMobileTeacher(request);
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id: studentId } = await context.params;
  const matchResult = await requireTeacherStudentMatch(teacher.id, studentId);
  if ("error" in matchResult) return matchResult.error;

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const startDate = typeof body.startDate === "string" ? body.startDate.trim() : "";
  if (!isValidDateString(startDate)) {
    return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
  }

  const days = body.days === 4 ? 4 : body.days === 7 ? 7 : null;
  if (!days) {
    return NextResponse.json({ error: "days must be 4 or 7" }, { status: 400 });
  }

  const tasks = parseTasks(body.tasks);
  if (tasks.length === 0) {
    return NextResponse.json({ error: "tasks required" }, { status: 400 });
  }
  if (tasks.length > 100) {
    return NextResponse.json({ error: "tasks too many" }, { status: 400 });
  }

  const repeatWeeks =
    typeof body.repeatWeeks === "number" &&
    Number.isInteger(body.repeatWeeks) &&
    body.repeatWeeks >= 1 &&
    body.repeatWeeks <= 12
      ? body.repeatWeeks
      : 1;

  const buckets = distributeTasks(tasks, days);
  const dates = Array.from({ length: repeatWeeks }).flatMap((_, weekIndex) =>
    Array.from({ length: days }).map((__, dayIndex) => ({
      date: addDays(startDate, weekIndex * 7 + dayIndex),
      tasks: buckets[dayIndex],
    })),
  );

  const existingPlans = await prisma.studyPlan.findMany({
    where: { studentId, date: { in: dates.map((entry) => entry.date) } },
    select: { id: true, date: true, tasks: { select: { order: true } } },
  });
  const existingPlanMap = new Map(existingPlans.map((plan) => [plan.date, plan]));

  const plans = await prisma.$transaction(
    dates.map(({ date, tasks: dayTasks }) => {
      const existingPlan = existingPlanMap.get(date);
      if (existingPlan) {
        const nextOrder =
          existingPlan.tasks.length > 0
            ? Math.max(...existingPlan.tasks.map((task) => task.order)) + 1
            : 0;
        return prisma.studyPlan.update({
          where: { id: existingPlan.id },
          data: {
            tasks: {
              create: dayTasks.map((title, order) => ({
                title,
                order: nextOrder + order,
                source: "teacher",
              })),
            },
          },
          include: { tasks: { orderBy: { order: "asc" } } },
        });
      }

      return prisma.studyPlan.create({
        data: {
          studentId,
          date,
          tasks: {
            create: dayTasks.map((title, order) => ({ title, order, source: "teacher" })),
          },
        },
        include: { tasks: { orderBy: { order: "asc" } } },
      });
    }),
  );

  return NextResponse.json({ plans, dates: plans.map((plan) => plan.date) }, { status: 201 });
}
