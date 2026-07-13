import { NextResponse } from "next/server";

import { requireMobileTeacher } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { resolveTeacherHourlyRate } from "@/lib/settlement";

/**
 * E9-3: 모바일 강사 본인 월별 정산 read-only 조회.
 *
 * 웹 /api/teacher/settlements(requireTeacher, 쿠키)와 동일 규칙을 Bearer 인증
 * (requireMobileTeacher)으로 재현한다. KST 월 경계·시급·환불 제외·durationMin=0
 * needsReview 규칙 모두 웹 라우트와 일치한다.
 *
 * Query: ?month=YYYY-MM (미지정 시 현재 KST 월)
 */
export async function GET(request: Request) {
  const authResult = await requireMobileTeacher(request);
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month");

  const now = new Date();
  // 현재 KST 연·월 (UTC+9)
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  let year = kstNow.getUTCFullYear();
  let month = kstNow.getUTCMonth() + 1;

  if (monthParam) {
    const m = /^(\d{4})-(\d{2})$/.exec(monthParam);
    if (!m) {
      return NextResponse.json({ error: "Invalid month (YYYY-MM)" }, { status: 400 });
    }
    year = Number(m[1]);
    month = Number(m[2]);
    if (month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }
  }

  // KST 월 경계를 UTC 반열림 구간으로 (settlement.ts와 동일 규칙)
  const kstMonthStart = new Date(Date.UTC(year, month - 1, 1, -9, 0, 0, 0));
  const kstMonthEnd = new Date(Date.UTC(year, month, 1, -9, 0, 0, 0));

  const lessons = await prisma.lesson.findMany({
    where: {
      teacherId: teacher.id,
      status: "COMPLETED",
      startAt: { gte: kstMonthStart, lt: kstMonthEnd },
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      studentId: true,
      subject: true,
      durationMin: true,
      startAt: true,
      student: { select: { name: true } },
    },
  });

  // 환불 기간에 걸친 수업은 정산에서 제외 (admin/웹 로직과 동일)
  const refundedPayments = await prisma.paymentCompletion.findMany({
    where: {
      status: "REFUNDED",
      subscriptionId: { not: null },
      studentId: { in: Array.from(new Set(lessons.map((l) => l.studentId))) },
    },
    select: { subscriptionId: true },
  });
  const refundedSubscriptionIds = refundedPayments
    .map((p) => p.subscriptionId)
    .filter((id): id is string => id !== null);

  const refundedPeriods: { studentId: string; start: Date; end: Date | null }[] = [];
  if (refundedSubscriptionIds.length > 0) {
    const subs = await prisma.subscription.findMany({
      where: { id: { in: refundedSubscriptionIds } },
      select: { studentId: true, periodStart: true, periodEnd: true },
    });
    for (const s of subs) {
      refundedPeriods.push({ studentId: s.studentId, start: s.periodStart, end: s.periodEnd });
    }
  }

  const isRefunded = (studentId: string, startAt: Date): boolean =>
    refundedPeriods.some(
      (p) =>
        p.studentId === studentId &&
        startAt >= p.start &&
        (p.end === null || startAt < p.end),
    );

  const payableLessons = lessons.filter((l) => !isRefunded(l.studentId, l.startAt));

  // E9-1: durationMin=0 수업은 합계에서 제외하고 needsReview로 표기.
  const items = payableLessons.map((l) => ({
    id: l.id,
    date: l.startAt.toISOString(),
    subject: l.subject,
    studentName: l.student.name,
    durationMin: l.durationMin,
    needsReview: l.durationMin === 0,
  }));

  const hourlyRateKrw = resolveTeacherHourlyRate(teacher.hourlyRateKrw);
  const totalMinutes = payableLessons.reduce((acc, l) => acc + l.durationMin, 0);
  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
  const payoutKrw = Math.round((totalMinutes / 60) * hourlyRateKrw);
  const needsReview = payableLessons.filter((l) => l.durationMin === 0).length;

  return NextResponse.json({
    year,
    month,
    hourlyRateKrw,
    lessonCount: payableLessons.length,
    totalMinutes,
    totalHours,
    payoutKrw,
    needsReview,
    lessons: items,
  });
}
