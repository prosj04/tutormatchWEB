import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { softDeleteUser } from "@/lib/account-deletion";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit-log";
import { getV2PlanById } from "@/lib/pricing-plans";
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

  const [user, subscription, billingProfile, teacherCount, pendingAcceptCount, firstLessonCount, latestReport, booking] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    prisma.subscription.findFirst({
      where: { studentId: student.id, status: { in: ["ACTIVE", "PAUSED", "PAST_DUE"] } },
      orderBy: { createdAt: "desc" },
      select: { plan: true, status: true, periodEnd: true },
    }),
    prisma.billingProfile.findUnique({
      where: { studentId: student.id },
      select: { autoRenew: true },
    }),
    prisma.teacherStudent.count({ where: { studentId: student.id, isActive: true } }),
    prisma.teacherStudent.count({
      where: { studentId: student.id, matchStatus: "PENDING_STUDENT_ACCEPT" },
    }),
    prisma.lesson.count({
      // 실제로 시작된(과거) 수업만 ACTIVE 판단에 사용 — 미래 예약 수업으로
      // ACTIVE가 조기 전이되지 않도록 startAt <= now 로 제한 (student-journey.ts와 동일).
      where: { studentId: student.id, status: { not: "CANCELLED" }, startAt: { lte: new Date() } },
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
          priceKrw: getV2PlanById(subscription.plan)?.priceKrw ?? null,
          status: subscription.status,
          periodEnd: subscription.periodEnd?.toISOString() ?? null,
          nextBilling: subscription.periodEnd
            ? formatBillingDate(subscription.periodEnd)
            : null,
          autoRenew: billingProfile?.autoRenew ?? null,
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
    recordAudit({
      actorUserId: userId,
      actorRole: "STUDENT",
      action: "ACCOUNT_DELETE",
      targetType: "User",
      targetId: userId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[mobile/me] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
