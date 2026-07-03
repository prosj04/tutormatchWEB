import Anthropic from "@anthropic-ai/sdk";

import { prisma } from "@/lib/prisma";
import { parseGoals, hasNonEmptyGoals } from "@/lib/consultation-report";
import { isAiAnswerEnabled } from "@/lib/ai-answer";

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

/** Attempts to generate an AI-powered Korean parent-facing summary.
 *  Falls back to the template string on any error or when unconfigured. */
async function tryAiSummary(
  fallback: string,
  params: {
    label: string;
    lessonCount: number;
    doneTaskCount: number;
    totalTaskCount: number;
    questionCount: number;
    goalLine: string;
  },
): Promise<string> {
  if (!isAiAnswerEnabled()) return fallback;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt =
      `다음 월간 학습 통계를 바탕으로 학부모에게 보낼 따뜻하고 긍정적인 3~4문장 요약을 한국어로 작성해주세요.\n` +
      `월: ${params.label}\n` +
      `완료 수업: ${params.lessonCount}회\n` +
      `과제 완료: ${params.doneTaskCount} / ${params.totalTaskCount}건\n` +
      `질문 등록: ${params.questionCount}건` +
      (params.goalLine ? `\n목표 관련: ${params.goalLine}` : "") +
      `\n요약은 학생의 노력을 칭찬하고, 부모님이 안심할 수 있도록 작성해주세요.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    const block = message.content.find((b) => b.type === "text");
    const text = block?.type === "text" ? block.text.trim() : "";
    return text || fallback;
  } catch {
    return fallback;
  }
}

export async function generateReportForStudent(
  studentId: string,
  month: string,
): Promise<void> {
  const { start, end, startDate, endDate } = getMonthBounds(month);

  const [lessonCount, plans, questionCount, consultationBooking] = await Promise.all([
    prisma.lesson.count({
      where: { studentId, status: "COMPLETED", startAt: { gte: startDate, lt: endDate } },
    }),
    prisma.studyPlan.findMany({
      where: { studentId, date: { gte: start, lt: end } },
      select: { tasks: { select: { isDone: true } } },
    }),
    prisma.questionMessage.count({
      where: {
        studentId,
        sender: "me",
        replyToId: null,
        date: { gte: start, lt: end },
      },
    }),
    prisma.consultationBooking.findFirst({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: { report: true },
    }),
  ]);

  const allTasks = plans.flatMap((p) => p.tasks);
  const doneTaskCount = allTasks.filter((t) => t.isDone).length;
  const totalTaskCount = allTasks.length;

  const label = monthLabel(month);
  const goals = consultationBooking?.report
    ? parseGoals(consultationBooking.report.goals)
    : null;
  const goalLine = (() => {
    if (!goals || !hasNonEmptyGoals(goals)) return "";
    const candidates = [...goals.quantitative, ...goals.qualitative];
    const refs = candidates.slice(0, 2).join(", ");
    return ` / 목표 대비: ${refs}`;
  })();
  const templateSummary = `${label} 완료 수업 ${lessonCount}회, 과제 완료 ${doneTaskCount}건, 질문 ${questionCount}건${goalLine}`;
  const summary = await tryAiSummary(templateSummary, {
    label,
    lessonCount,
    doneTaskCount,
    totalTaskCount,
    questionCount,
    goalLine,
  });
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
    prisma.questionMessage.findMany({
      where: {
        sender: "me",
        replyToId: null,
        date: { gte: start, lt: end },
      },
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
