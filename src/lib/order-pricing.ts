import {
  calculatePlanTotal,
  getRatePerSession,
  type SessionPlan,
  type SubjectCount,
} from "@/lib/pricing-plans";

export type { SessionPlan, SubjectCount };

export const PLAN_LABEL: Record<SessionPlan, string> = {
  4: "월 4회",
  8: "월 8회",
};

export function getPlanLabel(sessions: SessionPlan, subjects: SubjectCount): string {
  const base = PLAN_LABEL[sessions];
  return subjects === 2 ? `${base} · 2과목` : base;
}

/** 합계와 일치하도록 플랫폼 + 수업료 분리 (표시용) */
export function getPriceBreakdown(sessions: SessionPlan, subjects: SubjectCount = 1): {
  total: number;
  platformFee: number;
  lessonFee: number;
} {
  const total = calculatePlanTotal(sessions, subjects);
  const perSubjectPlatform = sessions === 4 ? 35_000 : 60_000;
  const platformFee = perSubjectPlatform * subjects;
  const lessonFee = total - platformFee;
  return { total, platformFee, lessonFee };
}

export function parseSessionsParam(raw: string | undefined): SessionPlan {
  if (raw === "8") return 8;
  return 4;
}

export function parseSubjectsParam(raw: string | undefined): SubjectCount {
  if (raw === "2") return 2;
  return 1;
}

export { calculatePlanTotal, getRatePerSession };
