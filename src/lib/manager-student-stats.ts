import { prisma } from "@/lib/prisma";
import { completionRate, getWeekRange } from "@/lib/manager-stats";

const STALE_MS = 24 * 60 * 60 * 1000;

export async function getStudentWeekStats(studentId: string, week?: { start: string; end: string }) {
  const range = week ?? getWeekRange();
  const staleBefore = new Date(Date.now() - STALE_MS);

  const [plans, staleQuestions] = await Promise.all([
    prisma.studyPlan.findMany({
      where: {
        studentId,
        date: { gte: range.start, lte: range.end },
      },
      include: { tasks: true },
    }),
    prisma.questionMessage.count({
      where: {
        studentId,
        sender: "me",
        replyToId: null,
        replies: { none: { sender: "tutor" } },
        createdAt: { lt: staleBefore },
      },
    }),
  ]);

  let done = 0;
  let total = 0;
  for (const plan of plans) {
    for (const task of plan.tasks) {
      total++;
      if (task.isDone) done++;
    }
  }

  return {
    completionRate: completionRate(done, total),
    unansweredStale: staleQuestions,
    weekStart: range.start,
    weekEnd: range.end,
  };
}

export async function getActiveTeacherForStudent(studentId: string) {
  const match = await prisma.teacherStudent.findFirst({
    where: { studentId, isActive: true },
    include: { teacher: { select: { id: true, name: true } } },
  });
  return match?.teacher ?? null;
}
