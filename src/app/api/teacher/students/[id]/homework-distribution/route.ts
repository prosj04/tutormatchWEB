import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireTeacherStudentMatch } from "@/lib/teacher-student-match";
import { requireTeacher } from "@/lib/teacher-auth";

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

function addDays(date: string, offset: number) {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(year, month - 1, day + offset, 12, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function parseTasks(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function distributeTasks(tasks: string[], days: 4 | 7) {
  const buckets = Array.from({ length: days }, () => [] as string[]);
  if (tasks.length === 0) return buckets;

  const activeDays = Math.min(days, tasks.length);
  // 앞쪽 날짜에 살짝 더 많은 과제를 배치하되, 가능한 모든 날짜에 최소 1개씩 배분한다.
  const weights = Array.from({ length: activeDays }, (_, index) => activeDays - index + 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const baseCounts = weights.map((weight) => Math.floor((tasks.length * weight) / totalWeight));

  if (tasks.length >= activeDays) {
    for (let i = 0; i < activeDays; i += 1) {
      baseCounts[i] = Math.max(1, baseCounts[i]);
    }
  }

  let assigned = baseCounts.reduce((sum, count) => sum + count, 0);
  const remainders = weights
    .map((weight, index) => ({
      index,
      value: (tasks.length * weight) / totalWeight - Math.floor((tasks.length * weight) / totalWeight),
    }))
    .sort((a, b) => b.value - a.value);

  while (assigned < tasks.length) {
    for (const { index } of remainders) {
      if (assigned >= tasks.length) break;
      baseCounts[index] += 1;
      assigned += 1;
    }
  }

  while (assigned > tasks.length) {
    for (let i = activeDays - 1; i >= 0; i -= 1) {
      if (assigned <= tasks.length) break;
      if (baseCounts[i] > 1) {
        baseCounts[i] -= 1;
        assigned -= 1;
      }
    }
  }

  let cursor = 0;
  for (let dayIndex = 0; dayIndex < activeDays; dayIndex += 1) {
    const count = baseCounts[dayIndex];
    buckets[dayIndex].push(...tasks.slice(cursor, cursor + count));
    cursor += count;
  }

  return buckets;
}

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireTeacher();
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
