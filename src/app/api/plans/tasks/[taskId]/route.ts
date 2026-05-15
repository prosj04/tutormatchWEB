import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/student-auth";

type RouteContext = { params: Promise<{ taskId: string }> };

async function getOwnedTask(taskId: string, studentId: string) {
  const task = await prisma.studyTask.findUnique({
    where: { id: taskId },
    include: { plan: true },
  });
  if (!task || task.plan.studentId !== studentId) return null;
  return task;
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { taskId } = await context.params;
  const existing = await getOwnedTask(taskId, student.id);
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  let body: { isDone?: unknown; title?: unknown; order?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: {
    title?: string;
    order?: number;
    isDone?: boolean;
    doneAt?: Date | null;
  } = {};

  if (typeof body.title === "string") {
    data.title = body.title.trim() || "새 할 일";
  }

  if (typeof body.order === "number" && Number.isFinite(body.order)) {
    data.order = body.order;
  }

  if (typeof body.isDone === "boolean") {
    data.isDone = body.isDone;
    data.doneAt = body.isDone ? new Date() : null;
  }

  const task = await prisma.studyTask.update({
    where: { id: taskId },
    data,
  });

  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { taskId } = await context.params;
  const existing = await getOwnedTask(taskId, student.id);
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.studyTask.delete({ where: { id: taskId } });
  return NextResponse.json({ ok: true });
}
