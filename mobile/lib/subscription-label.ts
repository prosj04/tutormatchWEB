/** 모바일 구독 플랜 라벨 (웹 pricing-plans 와 동일 규칙) */
export function formatPlanLabel(planId: string | null | undefined): string {
  if (!planId) return "플랜 없음";
  const weekly = planId.startsWith("8") ? 2 : 1;
  const subjects = planId.endsWith("-2") ? 2 : 1;
  if (subjects === 2) return `${subjects}과목 · 주 ${weekly}회`;
  return `1과목 · 주 ${weekly}회`;
}

export function formatEnrollmentStatus(
  status: string | null | undefined,
  teacherCount: number,
): string {
  if (teacherCount > 0 && status === "ACTIVE") return "수강 중";
  if (status === "ACTIVE") return "구독 중";
  if (status === "PAUSED") return "일시정지 중";
  if (status === "PAST_DUE") return "결제 확인 필요";
  if (status === "CANCELLED") return "구독 종료";
  return "상담 진행 중";
}
