import { prisma } from "@/lib/prisma";
import { isRefundedLesson, type RefundedPeriod } from "@/lib/settlement-refund";

export { isRefundedLesson, type RefundedPeriod };

/**
 * Default teacher hourly rate in KRW. Per-teacher override: Teacher.hourlyRateKrw.
 */
export const TEACHER_HOURLY_RATE_KRW = 30_000;

/** 관리자 수동 지정 프리셋 (2026-07-13 오너 확정). null = 기본 30,000. */
export const TEACHER_HOURLY_RATE_PRESETS_KRW = [32_000, 34_000, 40_000] as const;

export function resolveTeacherHourlyRate(hourlyRateKrw: number | null | undefined): number {
  return hourlyRateKrw ?? TEACHER_HOURLY_RATE_KRW;
}

export type TeacherSettlement = {
  teacherId: string;
  name: string;
  phone: string;
  lessonCount: number;
  totalMinutes: number;
  /** totalMinutes / 60, rounded to 2 decimal places */
  totalHours: number;
  /** Math.round(totalMinutes / 60 * 강사별 시급(hourlyRateKrw ?? 30,000)) — integer KRW */
  payoutKrw: number;
  /** Lessons where durationMin === 0. Schema has durationMin as non-null Int @default(50),
   *  so the only "missing" case in practice is an explicitly stored 0. */
  needsReview: number;
};

export type MonthlySettlementResult = {
  year: number;
  month: number;
  teachers: TeacherSettlement[];
  totals: {
    lessonCount: number;
    totalHours: number;
    payoutKrw: number;
  };
  /** Total across all teachers of lessons that need review */
  needsReview: number;
};

/**
 * Compute settlement for all teachers for the given KST calendar month.
 *
 * KST boundary logic:
 *   KST midnight = UTC 15:00 of the previous calendar day.
 *   So KST month start = Date.UTC(year, month-1, 1, -9) = UTC year-(month-1)-1 T15:00Z.
 *   Using a half-open interval: startAt >= kstMonthStart AND startAt < kstMonthEnd.
 *   The negative hour (-9) is intentional — JavaScript Date.UTC handles carry correctly.
 */
export async function computeMonthlySettlement(
  year: number,
  month: number,
): Promise<MonthlySettlementResult> {
  // KST month start/end in UTC (half-open interval)
  // Date.UTC(year, monthIndex, day, hour) — hour=-9 rolls back 9h from UTC midnight
  const kstMonthStart = new Date(Date.UTC(year, month - 1, 1, -9, 0, 0, 0));
  const kstMonthEnd = new Date(Date.UTC(year, month, 1, -9, 0, 0, 0));

  // Fetch all COMPLETED lessons in this KST month
  const lessons = await prisma.lesson.findMany({
    where: {
      status: "COMPLETED",
      startAt: {
        gte: kstMonthStart,
        lt: kstMonthEnd,
      },
    },
    select: {
      studentId: true,
      teacherId: true,
      durationMin: true,
      startAt: true,
    },
  });

  if (lessons.length === 0) {
    return { year, month, teachers: [], totals: { lessonCount: 0, totalHours: 0, payoutKrw: 0 }, needsReview: 0 };
  }

  // P2-2: Exclude lessons tied to REFUNDED payments so we never over-pay teachers
  // for service the student was refunded for.
  //
  // Data model has no direct Payment↔Lesson link. Payments reference subscriptions
  // (PaymentCompletion.subscriptionId), and subscriptions carry the paid period
  // (periodStart..periodEnd). So we treat a lesson as refunded-excluded when it
  // belongs to a student whose REFUNDED payment points at a subscription whose
  // active period covers the lesson's startAt. periodEnd null = open-ended.
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

  // Group by teacherId
  const grouped: Record<string, { totalMinutes: number; lessonCount: number; needsReview: number }> = {};
  for (const lesson of lessons) {
    // Skip lessons covered by a REFUNDED payment — they must not count toward payout.
    if (isRefunded(lesson.studentId, lesson.startAt)) continue;
    if (!grouped[lesson.teacherId]) {
      grouped[lesson.teacherId] = { totalMinutes: 0, lessonCount: 0, needsReview: 0 };
    }
    grouped[lesson.teacherId].lessonCount += 1;
    if (lesson.durationMin === 0) {
      grouped[lesson.teacherId].needsReview += 1;
    } else {
      grouped[lesson.teacherId].totalMinutes += lesson.durationMin;
    }
  }

  // Fetch teacher names and phones in one query
  const teacherIds = Object.keys(grouped);
  const teacherRows = await prisma.teacher.findMany({
    where: { id: { in: teacherIds } },
    select: { id: true, name: true, phone: true, hourlyRateKrw: true },
  });
  const teacherMap: Record<string, { name: string; phone: string; hourlyRateKrw: number | null }> = {};
  for (const t of teacherRows) {
    teacherMap[t.id] = { name: t.name, phone: t.phone, hourlyRateKrw: t.hourlyRateKrw };
  }

  // Build per-teacher settlements
  const teachers: TeacherSettlement[] = teacherIds
    .map((teacherId) => {
      const { totalMinutes, lessonCount, needsReview } = grouped[teacherId];
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
      const payoutKrw = Math.round(
        (totalMinutes / 60) * resolveTeacherHourlyRate(teacherMap[teacherId]?.hourlyRateKrw),
      );
      return {
        teacherId,
        name: teacherMap[teacherId]?.name ?? teacherId,
        phone: teacherMap[teacherId]?.phone ?? "",
        lessonCount,
        totalMinutes,
        totalHours,
        payoutKrw,
        needsReview,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Totals
  const totals = teachers.reduce(
    (acc, t) => ({
      lessonCount: acc.lessonCount + t.lessonCount,
      totalHours: Math.round((acc.totalHours + t.totalHours) * 100) / 100,
      payoutKrw: acc.payoutKrw + t.payoutKrw,
    }),
    { lessonCount: 0, totalHours: 0, payoutKrw: 0 },
  );

  const needsReview = teachers.reduce((acc, t) => acc + t.needsReview, 0);

  return { year, month, teachers, totals, needsReview };
}
