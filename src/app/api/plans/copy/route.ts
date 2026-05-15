import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isValidDateString, requireStudent } from "@/lib/student-auth";

export async function POST(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let body: { sourceDate?: unknown; targetDate?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sourceDate = body.sourceDate;
  const targetDate = body.targetDate;

  if (
    typeof sourceDate !== "string" ||
    typeof targetDate !== "string" ||
    !isValidDateString(sourceDate) ||
    !isValidDateString(targetDate)
  ) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  const sourcePlan = await prisma.studyPlan.findFirst({
    where: { studentId: student.id, date: sourceDate },
    include: { tasks: { orderBy: { order: "asc" } } },
  });

  if (!sourcePlan || sourcePlan.tasks.length === 0) {
    return NextResponse.json({ error: "Source plan not found" }, { status: 404 });
  }

  let targetPlan = await prisma.studyPlan.findFirst({
    where: { studentId: student.id, date: targetDate },
    include: { tasks: true },
  });

  if (!targetPlan) {
    targetPlan = await prisma.studyPlan.create({
      data: { studentId: student.id, date: targetDate },
      include: { tasks: true },
    });
  } else if (targetPlan.tasks.length > 0) {
    await prisma.studyTask.deleteMany({ where: { planId: targetPlan.id } });
  }

  await prisma.studyTask.createMany({
    data: sourcePlan.tasks.map((t, index) => ({
      planId: targetPlan!.id,
      title: t.title,
      order: index,
      isDone: false,
      doneAt: null,
    })),
  });

  const plan = await prisma.studyPlan.findUnique({
    where: { id: targetPlan.id },
    include: { tasks: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ plan });
}
