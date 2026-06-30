import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** GET /api/mobile/home — 홈 화면 집계 (오늘 수업 + 주간 달성률 + 다가오는 일정) */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // 이번 주 날짜 목록 (JS 연산, DB 불필요) — Promise.all 전에 미리 계산
  const day = now.getDay();
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

  // 모든 쿼리를 단일 Promise.all로 — 2 RTT (auth 1 + 여기서 1)
  const [todayLesson, upcoming, unreadCount, teacherMatches, plans] = await Promise.all([
    prisma.lesson.findFirst({
      where: {
        studentId: student.id,
        status: "SCHEDULED",
        startAt: { gte: now, lte: endOfDay },
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        subject: true,
        startAt: true,
        joinUrl: true,
        teacher: { select: { id: true, name: true } },
      },
    }),
    prisma.lesson.findMany({
      where: {
        studentId: student.id,
        status: "SCHEDULED",
        startAt: { gt: endOfDay },
      },
      orderBy: { startAt: "asc" },
      take: 5,
      select: {
        id: true,
        subject: true,
        startAt: true,
        teacher: { select: { id: true, name: true } },
      },
    }),
    prisma.notification.count({
      where: { userId: authResult.userId, isRead: false },
    }),
    prisma.teacherStudent.findMany({
      where: { studentId: student.id, isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        subjects: true,
        teacher: { select: { id: true, name: true } },
      },
    }),
    prisma.studyPlan.findMany({
      where: { studentId: student.id, date: { in: weekDates } },
      select: { tasks: { select: { isDone: true } } },
    }),
  ]);
  const tasks = plans.flatMap((p) => p.tasks);
  const done = tasks.filter((t) => t.isDone).length;
  const total = tasks.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const lessons = teacherMatches.map((m) => {
    const subject = m.subjects.split(/[,\s]+/).filter(Boolean)[0] ?? m.subjects;
    return {
      subject,
      teacher: m.teacher.name,
      teacherId: m.teacher.id,
      frequency: "배정됨",
    };
  });

  return NextResponse.json({
    greetingName: student.name,
    unreadCount,
    todayLesson,
    upcoming,
    lessons,
    weekProgress: { done, total, percent },
  });
}
