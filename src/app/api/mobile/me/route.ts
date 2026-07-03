import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { softDeleteUser } from "@/lib/account-deletion";
import { prisma } from "@/lib/prisma";
import { formatSubscriptionPlanLabel, formatSubscriptionStatus } from "@/lib/subscription-label";
import {
  CONSULTATION_STATUS_TO_STAGE,
  JOURNEY_STAGE_COPY,
  type ConsultationBookingStatus,
} from "@/lib/student-journey";

/** GET /api/mobile/me — 내 프로필 + 구독 + 학습 단계
 *  단일 Promise.all로 모든 쿼리를 한 RTT에 처리 (기존 3 RTT → 2 RTT)
 */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student, userId } = authResult;

  const [user, subscription, teacherCount, pendingAcceptCount, firstLessonCount, latestReport, booking] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    prisma.subscription.findFirst({
      where: { studentId: student.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { plan: true, status: true, periodEnd: true },
    }),
    prisma.teacherStudent.count({ where: { studentId: student.id, isActive: true } }),
    prisma.teacherStudent.count({
      where: {
        studentId: student.id,
        OR: [{ matchStatus: "PENDING_STUDENT_ACCEPT" }, { isActive: false }],
      },
    }),
    prisma.lesson.count({
      where: { studentId: student.id, status: { not: "CANCELLED" } },
    }),
    prisma.monthlyReport.findFirst({
      where: { studentId: student.id },
      orderBy: { month: "desc" },
      select: { month: true },
    }),
    prisma.consultationBooking.findFirst({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      select: { status: true, assignedAt: true, manager: { select: { name: true } } },
    }),
  ]);

  // Journey stage 계산 (DB 결과에서 직접 도출 — 추가 쿼리 없음)
  const consultationStatus = booking?.status as ConsultationBookingStatus | undefined;
  const stage =
    teacherCount > 0 && firstLessonCount > 0
      ? "ACTIVE"
      : teacherCount > 0
      ? "FIRST_LESSON_PENDING"
      : pendingAcceptCount > 0
      ? "MATCH_PENDING_ACCEPT"
      : !booking
      ? "ONBOARDED"
      : CONSULTATION_STATUS_TO_STAGE[consultationStatus!];

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.name,
      grade: student.grade ?? "",
      subjects: student.subjects ?? [],
      gender: student.gender ?? "",
      email: user?.email ?? "",
    },
    subscription: subscription
      ? {
          plan: subscription.plan,
          planLabel: formatSubscriptionPlanLabel(subscription.plan),
          status: subscription.status,
          periodEnd: subscription.periodEnd?.toISOString() ?? null,
          nextBilling: subscription.periodEnd
            ? formatBillingDate(subscription.periodEnd)
            : null,
        }
      : null,
    enrollmentStatus: formatSubscriptionStatus(subscription?.status, teacherCount),
    journey: {
      stage,
      label: JOURNEY_STAGE_COPY[stage].label,
      body: JOURNEY_STAGE_COPY[stage].body,
    },
    latestReportMonth: latestReport?.month ?? null,
  });
}

function formatBillingDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** DELETE /api/mobile/me — delete own account (soft-delete) */
export async function DELETE(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  try {
    await softDeleteUser(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[mobile/me] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
