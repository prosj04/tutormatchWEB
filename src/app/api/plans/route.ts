import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  isValidDateString,
  isValidMonthString,
  requireStudent,
} from "@/lib/student-auth";

export async function GET(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");
  const before = searchParams.get("before");
  const recent = searchParams.get("recent");

  if (month) {
    if (!isValidMonthString(month)) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }
    const plans = await prisma.studyPlan.findMany({
      where: { studentId: student.id, date: { startsWith: month } },
      select: { date: true },
    });
    return NextResponse.json({ dates: plans.map((p) => p.date) });
  }

  if (before && recent) {
    if (!isValidDateString(before)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const plans = await prisma.studyPlan.findMany({
      where: { studentId: student.id, date: { lt: before } },
      orderBy: { date: "desc" },
      take: Number(recent) || 7,
      include: { _count: { select: { tasks: true } } },
    });
    return NextResponse.json({
      plans: plans.map((p) => ({
        date: p.date,
        taskCount: p._count.tasks,
      })),
    });
  }

  if (!date || !isValidDateString(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const plan = await prisma.studyPlan.findFirst({
    where: { studentId: student.id, date },
    include: {
      tasks: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json({ plan });
}

export async function POST(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let body: { date?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const date = body.date;
  if (typeof date !== "string" || !isValidDateString(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const existing = await prisma.studyPlan.findFirst({
    where: { studentId: student.id, date },
    include: { tasks: { orderBy: { order: "asc" } } },
  });
  if (existing) {
    return NextResponse.json({ plan: existing });
  }

  const plan = await prisma.studyPlan.create({
    data: { studentId: student.id, date },
    include: { tasks: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ plan }, { status: 201 });
}
