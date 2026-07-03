import { prisma } from "@/lib/prisma";

/**
 * Teacher hourly rate in KRW.
 * Per-teacher rates are a later feature — single constant for now.
 */
export const TEACHER_HOURLY_RATE_KRW = 30_000;

export type TeacherSettlement = {
  teacherId: string;
  name: string;
  phone: string;
  lessonCount: number;
  totalMinutes: number;
  /** totalMinutes / 60, rounded to 2 decimal places */
  totalHours: number;
  /** Math.round(totalMinutes / 60 * TEACHER_HOURLY_RATE_KRW) — integer KRW */
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
      teacherId: true,
      durationMin: true,
    },
  });

  if (lessons.length === 0) {
    return { year, month, teachers: [], totals: { lessonCount: 0, totalHours: 0, payoutKrw: 0 }, needsReview: 0 };
  }

  // Group by teacherId
  const grouped: Record<string, { totalMinutes: number; lessonCount: number; needsReview: number }> = {};
  for (const lesson of lessons) {
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
    select: { id: true, name: true, phone: true },
  });
  const teacherMap: Record<string, { name: string; phone: string }> = {};
  for (const t of teacherRows) {
    teacherMap[t.id] = { name: t.name, phone: t.phone };
  }

  // Build per-teacher settlements
  const teachers: TeacherSettlement[] = teacherIds
    .map((teacherId) => {
      const { totalMinutes, lessonCount, needsReview } = grouped[teacherId];
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
      const payoutKrw = Math.round((totalMinutes / 60) * TEACHER_HOURLY_RATE_KRW);
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
