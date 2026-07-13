import {
  calculatePlanTotal,
  getRatePerSession,
  type SessionPlan,
  type SubjectCount,
} from "@/lib/pricing-plans";

export type { SessionPlan, SubjectCount };

export function parseSessionsParam(raw: string | undefined): SessionPlan {
  if (raw === "8") return 8;
  return 4;
}

export function parseSubjectsParam(raw: string | undefined): SubjectCount {
  if (raw === "2") return 2;
  return 1;
}

export { calculatePlanTotal, getRatePerSession };
