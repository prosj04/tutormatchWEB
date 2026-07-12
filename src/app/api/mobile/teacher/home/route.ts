import { NextResponse } from "next/server";

import { requireMobileTeacherAllowPending } from "@/lib/mobile-auth";
import { getPendingConfirmLessons } from "@/lib/lesson-confirm";
import { prisma } from "@/lib/prisma";

/** GET /api/mobile/teacher/home — 강사 대시보드 요약 (승인 대기 강사 포함) */
export async function GET(request: Request) {
  const authResult = await requireMobileTeacherAllowPending(request);
  if ("error" in authResult) return authResult.error;
  const { teacher, role } = authResult;

  const approved = role !== "TEACHER" || teacher.approved;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const lessons = await prisma.lesson.findMany({
    where: {
      teacherId: teacher.id,
      startAt: { gte: startOfToday },
      status: { not: "CANCELLED" },
    },
    select: {
      id: true,
      startAt: true,
      subject: true,
      durationMin: true,
      status: true,
      student: { select: { id: true, name: true } },
    },
    orderBy: { startAt: "asc" },
    take: 10,
  });

  const upcomingLessons = lessons.map((l) => ({
    id: l.id,
    startAt: l.startAt.toISOString(),
    subject: l.subject,
    durationMin: l.durationMin,
    status: l.status,
    studentId: l.student.id,
    studentName: l.student.name,
  }));

  const todayLessonCount = lessons.filter(
    (l) => l.startAt >= startOfToday && l.startAt < startOfTomorrow,
  ).length;

  // 수업 확인 제도 — 종료된(확인 대기) 수업. 승인 강사만.
  const pendingConfirmLessons = approved
    ? await getPendingConfirmLessons(teacher.id)
    : [];

  return NextResponse.json({
    approved,
    name: teacher.name,
    todayLessonCount,
    upcomingLessons,
    pendingConfirmLessons,
  });
}
