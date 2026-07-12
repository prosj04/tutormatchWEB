import { getV2PlanById, PRICING_PLANS } from "@/lib/pricing-plans";

export function formatSubscriptionPlanLabel(planId: string | null | undefined): string {
  if (!planId) return "플랜 없음";
  const v2 = getV2PlanById(planId);
  if (v2) {
    const tierLabel = v2.tier === "middle" ? "중등" : "고등";
    return `${tierLabel} · 주 ${v2.weekly}회 · 회당 ${v2.hoursPerLesson}시간`;
  }
  const found = PRICING_PLANS.find((p) => p.id === planId);
  if (found) return found.subtitle;
  const weekly = planId.startsWith("8") ? 2 : 1;
  const subjects = planId.endsWith("-2") ? 2 : 1;
  return `${subjects}과목 · 주 ${weekly}회`;
}

export function formatSubscriptionStatus(
  status: string | null | undefined,
  teacherCount: number,
): string {
  // PAUSED는 학생·학부모에게 별도 노출하지 않는다(2026-07-11 정책, 매니저 전용 상태)
  if (teacherCount > 0 && (status === "ACTIVE" || status === "PAUSED")) return "수강 중";
  if (status === "ACTIVE" || status === "PAUSED") return "구독 중";
  if (status === "PAST_DUE") return "결제 확인 필요";
  if (status === "CANCELLED") return "구독 종료";
  return "상담 진행 중";
}
