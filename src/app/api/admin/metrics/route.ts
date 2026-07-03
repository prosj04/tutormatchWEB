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

  return NextResponse.json({ cohorts, refundRate, leadTime });
}
