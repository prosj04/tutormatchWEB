import { prisma } from "@/lib/prisma";
import { createConsultationRequest } from "@/lib/student-enrollment";
import { getV2PlanById, PRICING_PLANS } from "@/lib/pricing-plans";
import { formatSubscriptionPlanLabel } from "@/lib/subscription-label";

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export type SubjectScore = { subject: string; prev: number | null; curr: number };

/**
 * 다음 결제일 계산. PAUSED 구독은 정지 경과분만큼 periodEnd를 앞으로 투영해
 * 과거로 남은 날짜가 노출되는 오해를 방지한다(정지 사실은 노출하지 않음).
 * 웹 결제 페이지와 동일한 투영식: periodEnd + (now - pausedAt).
 */
export function projectNextPaymentDate(sub: {
  status: string;
  periodEnd: Date | null;
  pausedAt: Date | null;
}): Date | null {
  if (!sub.periodEnd) return null;
  if (sub.status === "PAUSED" && sub.pausedAt) {
    const elapsedPaused = Date.now() - new Date(sub.pausedAt).getTime();
    if (elapsedPaused > 0) {
      return new Date(new Date(sub.periodEnd).getTime() + elapsedPaused);
    }
  }
  return new Date(sub.periodEnd);
}

/** 플랜 월정액 — v2 우선, legacy v1 계산식 폴백. 알 수 없으면 null(D5-1). */
export function planPriceKrw(planId: string): number | null {
  const v2 = getV2PlanById(planId);
  if (v2) return v2.priceKrw;
  const legacy = PRICING_PLANS.find((p) => p.id === planId);
  if (!legacy) return null;
  // LEGACY v1 계산식 — 신규 발급 금지, 예전 구독 이력 금액 병기용.
  return legacy.sessions * legacy.subjects * (legacy.sessions === 4 ? 100_000 : 90_000);
}

function parseSubjectScores(value: string | null): SubjectScore[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.subject === "string")
      .map((e) => ({
        subject: String(e.subject),
        prev: typeof e.prev === "number" ? e.prev : null,
        curr: typeof e.curr === "number" ? e.curr : 0,
      }));
  } catch {
    return [];
  }
}

/** 학부모에 연결된 자녀 목록 + 요약(구독 상태·최신 리포트). 삭제된 학생 제외. */
export async function listParentChildren(parentId: string) {
  const links = await prisma.parentStudent.findMany({
    where: { parentId, student: { deletedAt: null } },
    orderBy: { createdAt: "asc" },
    select: {
      linkedVia: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          name: true,
          grade: true,
          subjects: true,
          subscriptions: {
            // PAUSED 포함 — 학부모에겐 구독중과 동일 표기(2026-07-11 정책, 라벨에서 마스킹).
            // PAST_DUE 포함 — 학부모가 자녀 미납을 인지하고 재결제 개입할 수 있도록(D10-1).
            where: { status: { in: ["ACTIVE", "PAUSED", "PAST_DUE"] } },
            orderBy: { createdAt: "desc" },
            select: { plan: true, status: true, periodEnd: true, pausedAt: true },
          },
          monthlyReports: {
            orderBy: { month: "desc" },
            take: 1,
            select: { month: true },
          },
          consultationBookings: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true },
          },
        },
      },
    },
  });

  return links.map((link) => {
    // ACTIVE 우선, 없으면 PAST_DUE(미납 알림 노출용), 그다음 최신(PAUSED).
    const subs = link.student.subscriptions;
    const sub =
      subs.find((s) => s.status === "ACTIVE") ??
      subs.find((s) => s.status === "PAST_DUE") ??
      subs[0] ??
      null;
    return {
      id: link.student.id,
      name: link.student.name,
      grade: link.student.grade,
      subjects: link.student.subjects,
      linkedVia: link.linkedVia,
      subscription: sub
        ? {
            plan: sub.plan,
            // 서버 계산 라벨·투영 결제일을 함께 내려 클라이언트가 원값을 노출하지 않도록 한다.
            // (pausedAt 원값은 정책상 노출 금지 — 여기서 nextPaymentDate로만 투영)
            planLabel: formatSubscriptionPlanLabel(sub.plan),
            status: sub.status,
            periodEnd: sub.periodEnd,
            nextPaymentDate: projectNextPaymentDate(sub),
          }
        : null,
      latestReportMonth: link.student.monthlyReports[0]?.month ?? null,
      consultationStatus: link.student.consultationBookings[0]?.status ?? null,
    };
  });
}

/** 자녀 월간 리포트 목록(읽기). 호출부에서 연결 검증 선행. */
export async function listChildReports(studentId: string) {
  const reports = await prisma.monthlyReport.findMany({
    where: { studentId },
    orderBy: { month: "desc" },
    select: {
      month: true,
      summary: true,
      weakTypes: true,
      detail: true,
      overallScore: true,
      prevScore: true,
      subjectScores: true,
      teacherComment: true,
      managerComment: true,
    },
  });
  return reports.map((r) => ({
    month: r.month,
    summary: r.summary,
    weakTypes: parseJsonArray(r.weakTypes),
    detail: r.detail,
    overallScore: r.overallScore,
    prevScore: r.prevScore,
    subjectScores: parseSubjectScores(r.subjectScores),
    teacherComment: r.teacherComment,
    managerComment: r.managerComment,
  }));
}

/** 자녀 결제/청구 이력(완료·환불 기록). 호출부에서 연결 검증 선행. */
export async function listChildPayments(studentId: string) {
  const payments = await prisma.paymentCompletion.findMany({
    where: { studentId, status: { in: ["COMPLETED", "REFUNDED"] } },
    orderBy: { createdAt: "desc" },
    select: {
      orderId: true,
      plan: true,
      status: true,
      amount: true,
      cashReceiptUrl: true,
      completedAt: true,
      createdAt: true,
    },
  });
  return payments;
}

export type ChildConsultationResult =
  | { ok: true; status: string; alreadyOpen: boolean }
  | { ok: false; status: number; error: string };

/**
 * 학부모가 특정 자녀 상담을 신청. 학생 조회 후 createConsultationRequest 위임.
 * 진행 중 상담/매칭이 있으면 alreadyOpen 처리(멱등).
 */
export async function requestChildConsultation(
  studentId: string,
  note: string,
): Promise<ChildConsultationResult> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: { id: true, name: true, grade: true },
  });
  if (!student) {
    return { ok: false, status: 404, error: "학생을 찾을 수 없습니다." };
  }

  try {
    const booking = await createConsultationRequest({
      studentId: student.id,
      studentName: student.name,
      studentGrade: student.grade,
      note,
    });
    return { ok: true, status: booking.status, alreadyOpen: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ALREADY_ACTIVE" || msg === "ALREADY_MATCHING") {
      return { ok: true, status: "WAITING", alreadyOpen: true };
    }
    if (msg === "ALREADY_COMPLETED") {
      return { ok: true, status: "COMPLETED", alreadyOpen: true };
    }
    throw e;
  }
}

/** 학부모의 모든 연결 자녀 결제 이력을 자녀별로 묶어 반환. */
export async function listParentPayments(parentId: string) {
  const children = await listParentChildren(parentId);
  const result = [];
  for (const child of children) {
    result.push({
      studentId: child.id,
      studentName: child.name,
      payments: await listChildPayments(child.id),
    });
  }
  return result;
}
