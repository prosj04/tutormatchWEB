import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import {
  completionRate,
  getWeekRange,
  studentStatusBadge,
} from "@/lib/manager-stats";
import { getActiveTeacherForStudent } from "@/lib/manager-student-stats";
import { prisma } from "@/lib/prisma";

const STALE_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const range = getWeekRange();
  const staleBefore = new Date(Date.now() - STALE_MS);

  const links = await prisma.managerStudent.findMany({
    where: { managerId: teacher.id },
    include: { student: true },
    orderBy: { student: { name: "asc" } },
  });

  const studentIds = links.map((l) => l.studentId);

  if (studentIds.length === 0) {
    return NextResponse.json({
      overview: {
        studentCount: 0,
        avgCompletionRate: 0,
        staleQuestions: 0,
        atRiskCount: 0,
      },
      students: [],
      weekStart: range.start,
      weekEnd: range.end,
    });
  }

  const [plans, staleQuestions, allStaleByStudent] = await Promise.all([
    prisma.studyPlan.findMany({
      where: {
        studentId: { in: studentIds },
        date: { gte: range.start, lte: range.end },
      },
      include: { tasks: true },
    }),
    prisma.question.count({
      where: {
        studentId: { in: studentIds },
        teacherAnswer: null,
        createdAt: { lt: staleBefore },
      },
    }),
    prisma.question.groupBy({
      by: ["studentId"],
      where: {
        studentId: { in: studentIds },
        teacherAnswer: null,
        createdAt: { lt: staleBefore },
      },
      _count: { id: true },
    }),
  ]);

  const staleMap = new Map(
    allStaleByStudent.map((g) => [g.studentId, g._count.id]),
  );

  const planStats = new Map<string, { done: number; total: number }>();
  for (const plan of plans) {
    const cur = planStats.get(plan.studentId) ?? { done: 0, total: 0 };
    for (const task of plan.tasks) {
      cur.total++;
      if (task.isDone) cur.done++;
    }
    planStats.set(plan.studentId, cur);
  }

  const students = await Promise.all(
    links.map(async (link) => {
      const stats = planStats.get(link.studentId) ?? { done: 0, total: 0 };
      const rate = completionRate(stats.done, stats.total);
      const stale = staleMap.get(link.studentId) ?? 0;
      const assignedTeacher = await getActiveTeacherForStudent(link.studentId);
      const badge = studentStatusBadge(rate, stale > 0);

      return {
        id: link.student.id,
        name: link.student.name,
        grade: link.student.grade,
        teacherName: assignedTeacher?.name ?? "—",
        completionRate: rate,
        unansweredStale: stale,
        statusLabel: badge.label,
        statusClassName: badge.className,
      };
    }),
  );

  const rates = students.map((s) => s.completionRate);
  const avgCompletionRate =
    rates.length > 0
      ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
      : 0;

  const atRiskCount = students.filter((s) => s.completionRate < 70).length;

  return NextResponse.json({
    overview: {
      studentCount: students.length,
      avgCompletionRate,
      staleQuestions,
      atRiskCount,
    },
    students,
    weekStart: range.start,
    weekEnd: range.end,
  });
}
