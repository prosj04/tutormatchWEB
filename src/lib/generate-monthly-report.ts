import { prisma } from "@/lib/prisma";

function getMonthBounds(month: string): {
  start: string;
  end: string;
  startDate: Date;
  endDate: Date;
} {
  const [year, mon] = month.split("-").map(Number);
  const nextMonStr =
    mon === 12
      ? `${year + 1}-01`
      : `${year}-${String(mon + 1).padStart(2, "0")}`;
  // Lesson.startAt is a UTC DateTime; use UTC midnight as month boundary.
  return {
    start: `${month}-01`,
    end: `${nextMonStr}-01`,
    startDate: new Date(`${month}-01T00:00:00.000Z`),
    endDate: new Date(`${nextMonStr}-01T00:00:00.000Z`),
  };
}

function monthLabel(month: string): string {
  const [year, mon] = month.split("-");
  return `${year}년 ${parseInt(mon)}월`;
}

export async function generateReportForStudent(
  studentId: string,
  month: string,
): Promise<void> {
  const { start, end, startDate, endDate } = getMonthBounds(month);

  const [lessonCount, plans, questionCount] = await Promise.all([
    prisma.lesson.count({
      where: { studentId, status: "COMPLETED", startAt: { gte: startDate, lt: endDate } },
    }),
    prisma.studyPlan.findMany({
      where: { studentId, date: { gte: start, lt: end } },
      select: { tasks: { select: { isDone: true } } },
    }),
    prisma.question.count({
      where: { studentId, date: { gte: start, lt: end } },
    }),
  ]);

  const allTasks = plans.flatMap((p) => p.tasks);
  const doneTaskCount = allTasks.filter((t) => t.isDone).length;
  const totalTaskCount = allTasks.length;

  const label = monthLabel(month);
  const summary = `${label} 완료 수업 ${lessonCount}회, 과제 완료 ${doneTaskCount}건, 질문 ${questionCount}건`;
  const detail = [
    `수업 완료: ${lessonCount}회`,
    `과제 완료: ${doneTaskCount} / ${totalTaskCount}건`,
    `질문 등록: ${questionCount}건`,
  ].join("\n");

  await prisma.monthlyReport.upsert({
    where: { studentId_month: { studentId, month } },
    create: { studentId, month, summary, weakTypes: "[]", detail },
    update: { summary, detail, updatedAt: new Date() },
  });
}

export async function generateMonthlyReportsForMonth(
  month: string,
): Promise<{ processed: number }> {
  const { start, end, startDate, endDate } = getMonthBounds(month);

  const [lessonStudents, planStudents, questionStudents] = await Promise.all([
    prisma.lesson.findMany({
      where: { status: "COMPLETED", startAt: { gte: startDate, lt: endDate } },
      select: { studentId: true },
      distinct: ["studentId"],
    }),
    prisma.studyPlan.findMany({
      where: { date: { gte: start, lt: end } },
      select: { studentId: true },
      distinct: ["studentId"],
    }),
    prisma.question.findMany({
      where: { date: { gte: start, lt: end } },
      select: { studentId: true },
      distinct: ["studentId"],
    }),
  ]);

  const allStudentIds = Array.from(
    new Set([
      ...lessonStudents.map((l) => l.studentId),
      ...planStudents.map((p) => p.studentId),
      ...questionStudents.map((q) => q.studentId),
    ]),
  );

  for (const studentId of allStudentIds) {
    await generateReportForStudent(studentId, month);
  }

  return { processed: allStudentIds.length };
}

export function getPreviousMonth(): string {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const year = now.getFullYear();
  const mon = now.getMonth(); // 0-indexed; this is the previous month (1-indexed)
  if (mon === 0) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(mon).padStart(2, "0")}`;
}
