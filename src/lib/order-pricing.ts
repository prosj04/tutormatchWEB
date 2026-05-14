export type SessionPlan = 4 | 8;

export const PLAN_LABEL: Record<SessionPlan, string> = {
  4: "월 4회",
  8: "월 8회",
};

export const PLAN_TOTAL: Record<SessionPlan, number> = {
  4: 400_000,
  8: 720_000,
};

/** 합계와 일치하도록 플랫폼 + 수업료 분리 (표시용) */
export function getPriceBreakdown(sessions: SessionPlan): {
  total: number;
  platformFee: number;
  lessonFee: number;
} {
  const total = PLAN_TOTAL[sessions];
  const platformFee = sessions === 4 ? 35_000 : 60_000;
  const lessonFee = total - platformFee;
  return { total, platformFee, lessonFee };
}

export function parseSessionsParam(raw: string | undefined): SessionPlan {
  if (raw === "8") return 8;
  return 4;
}
