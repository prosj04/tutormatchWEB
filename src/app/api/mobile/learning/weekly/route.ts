import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const DAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** GET /api/mobile/learning/weekly — 주간 학습시간 + 이번주 과제 진척 */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  // 이번 주 (월요일 시작)
  const now = new Date();
  const day = now.getDay(); // 0=일
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(toDateString(d));
  }

  const sessions = await prisma.studySession.findMany({
    where: { studentId: student.id, date: { in: weekDates } },
    select: { date: true, minutes: true },
  });

  const minutesByDate = new Map<string, number>();
  for (const s of sessions) {
    minutesByDate.set(s.date, (minutesByDate.get(s.date) ?? 0) + s.minutes);
  }

  const bars = weekDates.map((date, i) => {
    const weekdayIdx = (monday.getDay() + i) % 7;
    return {
      date,
      label: DAY_LABEL[weekdayIdx],
      minutes: minutesByDate.get(date) ?? 0,
    };
  });

  const totalMinutes = bars.reduce((a, b) => a + b.minutes, 0);

  // 이번 주 과제 진척 (StudyPlan/StudyTask)
  const plans = await prisma.studyPlan.findMany({
    where: { studentId: student.id, date: { in: weekDates } },
    select: { tasks: { select: { isDone: true } } },
  });
  const allTasks = plans.flatMap((p) => p.tasks);
  const doneTasks = allTasks.filter((t) => t.isDone).length;

  return NextResponse.json({
    weekStart: weekDates[0],
    bars,
    totalMinutes,
    tasks: { done: doneTasks, total: allTasks.length },
  });
}
