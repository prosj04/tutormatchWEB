import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function toYYYYMM(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

/**
 * Median helper — mutates array (sorts in place).
 * Returns null for empty array.
 */
function median(arr: number[]): number | null {
  if (arr.length === 0) return null;
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

// ── Per-manager metric definitions ──────────────────────────────────────────
//
// CONSULTATION_COMPLETION_PROXY:
//   ConsultationBooking has no explicit completedAt column.
//   We proxy "consultation completed timestamp" as:
//     visitConfirmedAt ?? assignedAt ?? createdAt
//   Priority: visit confirmed > manager-assigned > created (fallback for old rows).
//
// CONVERSION_DEFINITION:
//   Denominator = distinct students who have ≥1 COMPLETED consultation under
//                 this manager (using earliest such proxy timestamp per student).
//   Numerator   = subset whose PaymentCompletion (status=COMPLETED, completedAt
//                 non-null) has completedAt STRICTLY AFTER that earliest proxy.
//   Rationale: one student may have multiple consultations; the first completion
//   establishes when the manager "delivered", and any subsequent COMPLETED
//   payment counts as converted.
//
// MATCH_STUDENT_SET:
//   All consultationBookings for this manager (any status), yielding a studentId set.
//   TeacherStudent rows for those students are attributed to this manager.
//
// MATCH_ACCEPTANCE_RATE:
//   Counts over ACTIVE / PENDING_STUDENT_ACCEPT / CANCELLED across that student set.
//   Rate = ACTIVE / (ACTIVE + PENDING_STUDENT_ACCEPT + CANCELLED).
//
// MEDIAN_ACCEPT_HOURS:
//   Only rows with matchStatus=ACTIVE and respondedAt non-null.
//   Hours = (respondedAt - createdAt) / 3_600_000.
//
// CARE_30D:
//   ManagerCareLog rows with createdAt >= now - 30 days, grouped by managerId.
// ────────────────────────────────────────────────────────────────────────────

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const now = new Date();
  const cutoff12m = new Date(now);
  cutoff12m.setUTCFullYear(cutoff12m.getUTCFullYear() - 1);
  cutoff12m.setUTCDate(1);
  cutoff12m.setUTCHours(0, 0, 0, 0);

  const cutoff90d = addDays(now, -90);

  // ── All COMPLETED + REFUNDED payments ───────────────────────────────────
  const allPayments = await prisma.paymentCompletion.findMany({
    where: { status: { in: ["COMPLETED", "REFUNDED"] } },
    select: {
      id: true,
      studentId: true,
      status: true,
      completedAt: true,
    },
    orderBy: { completedAt: "asc" },
  });

  // ── (a) Monthly cohorts — last 12 months ────────────────────────────────
  // Cohort month = month of first COMPLETED payment per student.
  // A student is counted as 재결제 if they have any COMPLETED payment in a
  // strictly later month than their cohort month.

  // Build per-student first COMPLETED completedAt (plain object for TS compat)
  const firstCompletedByStudent: Record<string, Date> = {};
  for (const p of allPayments) {
    if (p.status === "COMPLETED" && p.completedAt) {
      if (!firstCompletedByStudent[p.studentId]) {
        firstCompletedByStudent[p.studentId] = p.completedAt;
      }
    }
  }

  // Build per-student all COMPLETED months (set of YYYY-MM)
  const completedMonthsByStudent: Record<string, string[]> = {};
  for (const p of allPayments) {
    if (p.status === "COMPLETED" && p.completedAt) {
      if (!completedMonthsByStudent[p.studentId]) {
        completedMonthsByStudent[p.studentId] = [];
      }
      const ym = toYYYYMM(p.completedAt);
      if (!completedMonthsByStudent[p.studentId].includes(ym)) {
        completedMonthsByStudent[p.studentId].push(ym);
      }
    }
  }

  // Collect cohort months in last 12 months
  const cohortMap: Record<string, { cohortSize: number; repurchaseCount: number }> = {};

  for (const studentId of Object.keys(firstCompletedByStudent)) {
    const firstDate = firstCompletedByStudent[studentId];
    if (firstDate < cutoff12m) continue; // outside 12-month window
    const cohortMonth = toYYYYMM(firstDate);
    if (!cohortMap[cohortMonth]) {
      cohortMap[cohortMonth] = { cohortSize: 0, repurchaseCount: 0 };
    }
    cohortMap[cohortMonth].cohortSize += 1;

    // Check if any COMPLETED payment is in a later month
    const allMonths = completedMonthsByStudent[studentId] ?? [];
    const hasRepurchase = allMonths.some((m) => m > cohortMonth);
    if (hasRepurchase) cohortMap[cohortMonth].repurchaseCount += 1;
  }

  const cohorts = Object.keys(cohortMap)
    .sort((a, b) => a.localeCompare(b))
    .map((month) => {
      const { cohortSize, repurchaseCount } = cohortMap[month];
      return {
        month,
        cohortSize,
        repurchaseCount,
        repurchaseRate: cohortSize > 0 ? repurchaseCount / cohortSize : 0,
      };
    });

  // ── (b) Refund rate ─────────────────────────────────────────────────────
  // Overall
  let totalCompleted = 0;
  let totalRefunded = 0;
  // Last 90 days
  let d90Completed = 0;
  let d90Refunded = 0;

  for (const p of allPayments) {
    if (!p.completedAt) continue;
    if (p.status === "COMPLETED") {
      totalCompleted += 1;
      if (p.completedAt >= cutoff90d) d90Completed += 1;
    } else if (p.status === "REFUNDED") {
      totalRefunded += 1;
      if (p.completedAt >= cutoff90d) d90Refunded += 1;
    }
  }

  const totalDenom = totalCompleted + totalRefunded;
  const d90Denom = d90Completed + d90Refunded;

  const refundRate = {
    overall: {
      refundedCount: totalRefunded,
      completedCount: totalCompleted,
      rate: totalDenom > 0 ? totalRefunded / totalDenom : 0,
    },
    last90Days: {
      refundedCount: d90Refunded,
      completedCount: d90Completed,
      rate: d90Denom > 0 ? d90Refunded / d90Denom : 0,
    },
  };

  // ── (c) First-lesson lead time ───────────────────────────────────────────
  // For students who have a first COMPLETED payment and at least one lesson,
  // compute days between completedAt and earliest lesson startAt.

  const studentsWithFirstPayment = Object.keys(firstCompletedByStudent).map(
    (studentId) => ({ studentId, completedAt: firstCompletedByStudent[studentId] }),
  );
  const studentIds = studentsWithFirstPayment.map((s) => s.studentId);

  const lessons = await prisma.lesson.findMany({
    where: { studentId: { in: studentIds } },
    select: { studentId: true, startAt: true },
    orderBy: { startAt: "asc" },
  });

  // Build earliest lesson per student
  const earliestLessonByStudent: Record<string, Date> = {};
  for (const l of lessons) {
    if (!earliestLessonByStudent[l.studentId]) {
      earliestLessonByStudent[l.studentId] = l.startAt;
    }
  }

  const leadTimeDays: number[] = [];
  for (const { studentId, completedAt } of studentsWithFirstPayment) {
    const lessonDate = earliestLessonByStudent[studentId];
    if (!lessonDate) continue;
    const diffDays = (lessonDate.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays >= 0) leadTimeDays.push(diffDays);
  }

  leadTimeDays.sort((a, b) => a - b);
  const ltCount = leadTimeDays.length;
  const ltAvg = ltCount > 0 ? leadTimeDays.reduce((s, v) => s + v, 0) / ltCount : null;
  const ltP90 =
    ltCount > 0
      ? leadTimeDays[Math.min(Math.ceil(ltCount * 0.9) - 1, ltCount - 1)]
      : null;

  const leadTime = {
    studentCount: ltCount,
    avgDays: ltAvg !== null ? Math.round(ltAvg * 10) / 10 : null,
    p90Days: ltP90 !== null ? Math.round(ltP90 * 10) / 10 : null,
  };

  // ── (d) Per-manager performance metrics ─────────────────────────────────
  const cutoff30d = addDays(now, -30);

  // 1. Fetch all managers (Teacher rows where user.role is MANAGER or CHIEF_MANAGER)
  const managerTeachers = await prisma.teacher.findMany({
    where: { user: { role: { in: ["MANAGER", "CHIEF_MANAGER"] } } },
    select: {
      id: true,
      name: true,
      user: { select: { role: true } },
    },
  });

  if (managerTeachers.length === 0) {
    return NextResponse.json({ cohorts, refundRate, leadTime, managers: [] });
  }

  const managerIds = managerTeachers.map((m) => m.id);

  // 2. Fetch all consultation bookings for these managers (any status)
  const managerBookings = await prisma.consultationBooking.findMany({
    where: { managerId: { in: managerIds } },
    select: {
      id: true,
      managerId: true,
      studentId: true,
      status: true,
      createdAt: true,
      assignedAt: true,
      visitConfirmedAt: true,
    },
  });

  // Build per-manager sets and indexes
  const bookingsByManager: Record<string, typeof managerBookings> = {};
  for (const b of managerBookings) {
    if (!b.managerId) continue;
    if (!bookingsByManager[b.managerId]) bookingsByManager[b.managerId] = [];
    bookingsByManager[b.managerId].push(b);
  }

  // Collect all student IDs across all managers (union, for batch queries)
  const allManagerStudentIds = Array.from(new Set(managerBookings.map((b) => b.studentId)));

  // 3. Fetch TeacherStudent rows for those students (match data)
  const allMatches = await prisma.teacherStudent.findMany({
    where: { studentId: { in: allManagerStudentIds } },
    select: {
      studentId: true,
      matchStatus: true,
      createdAt: true,
      respondedAt: true,
    },
  });

  // 4. Fetch COMPLETED payments for those students
  const allManagerPayments = await prisma.paymentCompletion.findMany({
    where: {
      studentId: { in: allManagerStudentIds },
      status: "COMPLETED",
      completedAt: { not: null },
    },
    select: {
      studentId: true,
      completedAt: true,
    },
  });

  // Build payment index: studentId → earliest COMPLETED completedAt
  const firstPaymentByStudent: Record<string, Date> = {};
  for (const p of allManagerPayments) {
    if (!p.completedAt) continue;
    const existing = firstPaymentByStudent[p.studentId];
    if (!existing || p.completedAt < existing) {
      firstPaymentByStudent[p.studentId] = p.completedAt;
    }
  }

  // 5. Fetch ManagerCareLog entries in last 30 days
  const recentCareLogs = await prisma.managerCareLog.findMany({
    where: {
      managerId: { in: managerIds },
      createdAt: { gte: cutoff30d },
    },
    select: { managerId: true },
  });

  // Build care log count per manager
  const careLogCountByManager: Record<string, number> = {};
  for (const log of recentCareLogs) {
    careLogCountByManager[log.managerId] = (careLogCountByManager[log.managerId] ?? 0) + 1;
  }

  // ── Compute per-manager stats ────────────────────────────────────────────
  const managers = managerTeachers
    .sort((a, b) => {
      // CHIEF_MANAGER first, then alphabetical by name
      if (a.user.role === b.user.role) return a.name.localeCompare(b.name);
      return a.user.role === "CHIEF_MANAGER" ? -1 : 1;
    })
    .map((mgr) => {
      const bookings = bookingsByManager[mgr.id] ?? [];

      // ── Consultation counts ──
      const totalBookings = bookings.length;
      const openBookings = bookings.filter(
        (b) => b.status === "WAITING" || b.status === "ASSIGNED",
      ).length;

      // ── Conversion rate ──
      // Proxy timestamp for "consultation completed": visitConfirmedAt ?? assignedAt ?? createdAt
      const completedBookings = bookings.filter((b) => b.status === "COMPLETED");

      // Earliest proxy per student (among COMPLETED consultations)
      const earliestConsultByStudent: Record<string, Date> = {};
      for (const b of completedBookings) {
        const proxyTs = b.visitConfirmedAt ?? b.assignedAt ?? b.createdAt;
        const existing = earliestConsultByStudent[b.studentId];
        if (!existing || proxyTs < existing) {
          earliestConsultByStudent[b.studentId] = proxyTs;
        }
      }

      const conversionDenomStudents = Object.keys(earliestConsultByStudent);
      let conversionNumerator = 0;
      for (const sid of conversionDenomStudents) {
        const consultTs = earliestConsultByStudent[sid];
        const paymentTs = firstPaymentByStudent[sid];
        if (paymentTs && paymentTs > consultTs) conversionNumerator += 1;
      }
      const conversionDenominator = conversionDenomStudents.length;
      const conversionRate =
        conversionDenominator > 0 ? conversionNumerator / conversionDenominator : null;

      // ── Match acceptance rate ──
      // Student set: all bookings for this manager (any status)
      const mgrStudentIds = new Set(bookings.map((b) => b.studentId));
      const mgrMatches = allMatches.filter((m) => mgrStudentIds.has(m.studentId));

      let matchActive = 0;
      let matchPending = 0;
      let matchCancelled = 0;
      const acceptHours: number[] = [];

      for (const m of mgrMatches) {
        if (m.matchStatus === "ACTIVE") {
          matchActive += 1;
          if (m.respondedAt) {
            const hrs = (m.respondedAt.getTime() - m.createdAt.getTime()) / 3_600_000;
            if (hrs >= 0) acceptHours.push(hrs);
          }
        } else if (m.matchStatus === "PENDING_STUDENT_ACCEPT") {
          matchPending += 1;
        } else if (m.matchStatus === "CANCELLED") {
          matchCancelled += 1;
        }
      }

      const matchTotal = matchActive + matchPending + matchCancelled;
      const matchAcceptanceRate = matchTotal > 0 ? matchActive / matchTotal : null;
      const medianAcceptHours = median(acceptHours);

      // ── Care log (30d) ──
      const careLog30d = careLogCountByManager[mgr.id] ?? 0;

      return {
        id: mgr.id,
        name: mgr.name,
        role: mgr.user.role,
        consultations: {
          total: totalBookings,
          open: openBookings,
        },
        conversion: {
          denominator: conversionDenominator,
          numerator: conversionNumerator,
          rate: conversionRate,
        },
        matchAcceptance: {
          active: matchActive,
          pending: matchPending,
          cancelled: matchCancelled,
          rate: matchAcceptanceRate,
          medianAcceptHours:
            medianAcceptHours !== null ? Math.round(medianAcceptHours * 10) / 10 : null,
        },
        careLog30d,
      };
    });

  return NextResponse.json({ cohorts, refundRate, leadTime, managers });
}
