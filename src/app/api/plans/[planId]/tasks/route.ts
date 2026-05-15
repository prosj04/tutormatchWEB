import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/student-auth";

type RouteContext = { params: Promise<{ planId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { planId } = await context.params;

  const plan = await prisma.studyPlan.findFirst({
    where: { id: planId, studentId: student.id },
    include: { tasks: true },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  let body: { title?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";

  const maxOrder = plan.tasks.reduce((max, t) => Math.max(max, t.order), -1);

  const task = await prisma.studyTask.create({
    data: {
      planId,
      title: title || "새 할 일",
      order: maxOrder + 1,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
