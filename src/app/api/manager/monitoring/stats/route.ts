import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { getWeekRange } from "@/lib/manager-stats";
import { prisma } from "@/lib/prisma";

const STALE_MS = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  const link = await prisma.managerStudent.findUnique({
    where: {
      managerId_studentId: {
        managerId: teacher.id,
        studentId,
      },
    },
  });

  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const range = getWeekRange();
  const staleBefore = new Date(Date.now() - STALE_MS);

  const [plans, unanswered, student] = await Promise.all([
    prisma.studyPlan.findMany({
      where: {
        studentId,
        date: { gte: range.start, lte: range.end },
      },
      include: {
        tasks: { orderBy: { order: "asc" } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.question.findMany({
      where: {
        studentId,
        teacherAnswer: null,
        createdAt: { lt: staleBefore },
      },
      select: { id: true, date: true, content: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.student.findUnique({
      where: { id: studentId },
      select: { name: true, grade: true },
    }),
  ]);

  const recentComments = plans
    .filter((p) => p.comment)
    .slice(-3)
    .map((p) => ({
      date: p.date,
      comment: p.comment,
      commentAt: p.commentAt?.toISOString() ?? null,
    }));

  return NextResponse.json({
    student,
    weekStart: range.start,
    weekEnd: range.end,
    plans: plans.map((p) => ({
      id: p.id,
      date: p.date,
      tasks: p.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        isDone: t.isDone,
      })),
      comment: p.comment,
    })),
    unansweredQuestions: unanswered.map((q) => ({
      id: q.id,
      date: q.date,
      content: q.content,
      createdAt: q.createdAt.toISOString(),
    })),
    recentComments,
  });
}
