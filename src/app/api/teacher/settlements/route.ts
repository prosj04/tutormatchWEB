import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { TEACHER_HOURLY_RATE_KRW } from "@/lib/settlement";
import { isRefundedLesson, type RefundedPeriod } from "@/lib/settlement-refund";
import { requireTeacher } from "@/lib/teacher-auth";

/**
 * E9: 강사 본인 월별 정산 read-only 조회.
 *
 * admin 정산(computeMonthlySettlement)은 전체 강사를 집계하므로 그대로 노출할 수
 * 없다. 여기서는 로그인한 강사 본인의 COMPLETED 수업만 조회하고, admin과 동일한
 * KST 월 경계·시급(TEACHER_HOURLY_RATE_KRW)·환불 제외 규칙을 따른다.
 *
 * Query: ?month=YYYY-MM (미지정 시 현재 KST 월)
 */
export async function GET(request: Request) {
  const authResult = await requireTeacher();
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

  // 환불 기간에 걸친 수업은 정산에서 제외 (admin 로직과 동일)
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

  const refundedPeriods: RefundedPeriod[] = [];
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
    isRefundedLesson(refundedPeriods, studentId, startAt);

  const payableLessons = lessons.filter((l) => !isRefunded(l.studentId, l.startAt));

  // E9-1: durationMin=0 수업은 admin(computeMonthlySettlement)과 동일하게
  // 합계(payout)에서 제외하고 needsReview로 표기한다. lessonCount에는 포함.
  const items = payableLessons.map((l) => ({
    id: l.id,
    date: l.startAt.toISOString(),
    subject: l.subject,
    studentName: l.student.name,
    durationMin: l.durationMin,
    needsReview: l.durationMin === 0,
  }));

  const totalMinutes = payableLessons.reduce((acc, l) => acc + l.durationMin, 0);
  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
  const payoutKrw = Math.round((totalMinutes / 60) * TEACHER_HOURLY_RATE_KRW);
  const needsReview = payableLessons.filter((l) => l.durationMin === 0).length;

  return NextResponse.json({
    year,
    month,
    hourlyRateKrw: TEACHER_HOURLY_RATE_KRW,
    lessonCount: payableLessons.length,
    totalMinutes,
    totalHours,
    payoutKrw,
    needsReview,
    lessons: items,
  });
}
