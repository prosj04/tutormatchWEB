/** 공개 요금 카드 학년 탭 — 중등/고등 카드 세트 분리 시 사용 */
export type PricingSchoolTier = "middle" | "high";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  V2 PRICING (2026-07 이후) — 시간 단위 월정액
 *  주(1|2) × 회당 시간(2|3) × 중등/고등 = 8개 플랜.
 *  과목 수 곱연산 폐지. 과목은 상담에서 배정.
 *  8개 금액이 모두 유일하므로 amount → planId 역매핑이 total & unambiguous.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type V2Tier = "middle" | "high";
export type V2Weekly = 1 | 2;
export type V2HoursPerLesson = 2 | 3;

/** 정가 기준 시급 (원). 마케팅 정가/할인율 산출 기준. */
const LIST_PRICE_PER_HOUR_KRW = 50_000;

/** 월 4주 기준 (weekly × hoursPerLesson × 4) */
export const MONTHS_PER_BILLING_CYCLE_WEEKS = 4;

export type PricingPlanV2 = {
  id: string;
  tier: V2Tier;
  weekly: V2Weekly;
  hoursPerLesson: V2HoursPerLesson;
  /** 월 총 수업 시간 = weekly × hoursPerLesson × 4 */
  monthlyHours: number;
  /** 월정액 (원) */
  priceKrw: number;
  /** 정가 월액 = monthlyHours × 시간당 정가 */
  listPriceKrw?: number;
  /** 정가 대비 할인율(정수 %). 정가 이상(할인 없음)이면 null. */
  discountRate: number | null;
  title: string;
  subtitle: string;
};

function v2Id(tier: V2Tier, weekly: V2Weekly, hours: V2HoursPerLesson): string {
  const t = tier === "middle" ? "mid" : "high";
  return `${t}-w${weekly}h${hours}`;
}

function makeV2Plan(
  tier: V2Tier,
  weekly: V2Weekly,
  hoursPerLesson: V2HoursPerLesson,
  priceKrw: number,
): PricingPlanV2 {
  const monthlyHours = weekly * hoursPerLesson * MONTHS_PER_BILLING_CYCLE_WEEKS;
  const listPriceKrw = monthlyHours * LIST_PRICE_PER_HOUR_KRW;
  const rawDiscount = listPriceKrw > priceKrw
    ? Math.round(((listPriceKrw - priceKrw) / listPriceKrw) * 100)
    : 0;
  const discountRate = rawDiscount > 0 ? rawDiscount : null;
  const tierLabel = tier === "middle" ? "중등" : "고등";
  return {
    id: v2Id(tier, weekly, hoursPerLesson),
    tier,
    weekly,
    hoursPerLesson,
    monthlyHours,
    priceKrw,
    ...(listPriceKrw > priceKrw ? { listPriceKrw } : {}),
    discountRate,
    title: `${tierLabel} · 주 ${weekly}회 · 회당 ${hoursPerLesson}시간`,
    subtitle: `주 ${weekly}회 · 회당 ${hoursPerLesson}시간`,
  };
}

/** 새 결제·마케팅용 8개 플랜. 금액 유일성 보장. */
export const PRICING_PLANS_V2: PricingPlanV2[] = [
  makeV2Plan("middle", 1, 2, 380_000),
  makeV2Plan("middle", 1, 3, 550_000),
  makeV2Plan("middle", 2, 2, 760_000),
  makeV2Plan("middle", 2, 3, 1_060_000),
  makeV2Plan("high", 1, 2, 430_000),
  makeV2Plan("high", 1, 3, 580_000),
  makeV2Plan("high", 2, 2, 780_000),
  makeV2Plan("high", 2, 3, 1_120_000),
];

const V2_PLAN_BY_ID: Map<string, PricingPlanV2> = new Map(
  PRICING_PLANS_V2.map((p) => [p.id, p]),
);

const V2_AMOUNT_TO_ID: Map<number, string> = new Map(
  PRICING_PLANS_V2.map((p) => [p.priceKrw, p.id]),
);

export function getV2PlanById(id: string | null | undefined): PricingPlanV2 | null {
  if (!id) return null;
  return V2_PLAN_BY_ID.get(id) ?? null;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LEGACY PRICING (호환용) — v1
 *  구 세션수×과목수 모델 & 마케팅 카드(PRICING_PLAN_SLOTS). untouchable WIP
 *  파일(PricingContent.tsx, admin CMS 등)이 여전히 이 모양을 읽는다.
 *  절대 삭제 금지. 결제 금액 인식(planIdFromAmount)에서도 계속 인식되어야 함.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** @deprecated v1 세션수 (월 4·8회). 마케팅/CMS·slot 호환용. */
export type SessionPlan = 4 | 8;
/** @deprecated v1 과목수 (1·2). 마케팅/CMS·slot 호환용. */
export type SubjectCount = 1 | 2;

/** @deprecated v1 회당 요금 상수. */
const RATE_WEEKLY_ONCE = 100_000;
/** @deprecated v1 회당 요금 상수. */
const RATE_WEEKLY_TWICE_OR_MORE = 90_000;

/** 모든 플랜에 공통으로 포함되는 가치 항목 */
export const PLAN_INCLUDES = [
  "전담 매니저 배정 및 정기 관리",
  "월간 학습 리포트",
  "숙제 관리 및 자동 분배",
  "질문 답변 지원",
  "선생님 매칭 및 교체 상담",
] as const;

/** @deprecated v1 계산식 유지. 마케팅/CMS 표시용. */
export function getRatePerSession(sessions: SessionPlan): number {
  return sessions === 4 ? RATE_WEEKLY_ONCE : RATE_WEEKLY_TWICE_OR_MORE;
}

/** @deprecated v1 계산식 유지. 마케팅/CMS 표시용. */
export function calculatePlanTotal(sessions: SessionPlan, subjects: SubjectCount): number {
  return getRatePerSession(sessions) * sessions * subjects;
}

export type PricingPlanDefinition = {
  id: string;
  sessions: SessionPlan;
  subjects: SubjectCount;
  title: string;
  subtitle: string;
  features: string[];
  recommended?: boolean;
};

const BASE_FEATURES_4 = [
  "주 1회 수업 (50분)",
  "학습 진도 관리",
  "과제 관리",
  "AI 질답 이용 가능",
  "수시 강사 첨삭, 질답",
];

const BASE_FEATURES_8 = [
  "주 2회 수업 (50분)",
  "학습 진도 관리",
  "과제 관리",
  "AI 질답 횟수 2배 제공",
  "수시 강사 첨삭, 질답",
];

/** @deprecated v1 카드 리스트 — 마케팅/CMS 호환 유지용. 결제 인식은 planIdFromAmount 참조. */
export const PRICING_PLANS: PricingPlanDefinition[] = [
  {
    id: "4-1",
    sessions: 4,
    subjects: 1,
    title: "월 4회",
    subtitle: "1과목 · 주 1회",
    features: BASE_FEATURES_4,
  },
  {
    id: "8-1",
    sessions: 8,
    subjects: 1,
    title: "월 8회",
    subtitle: "1과목 · 주 2회",
    features: [...BASE_FEATURES_8, "복수 과목 선택 가능"],
    recommended: true,
  },
  {
    id: "4-2",
    sessions: 4,
    subjects: 2,
    title: "월 4회",
    subtitle: "2과목 · 주 1회",
    features: [
      "과목별 주 1회 수업 (50분)",
      "선생님 2명 배정",
      "학습 진도·과제 관리",
      "AI 질답 이용 가능",
    ],
    recommended: true,
  },
  {
    id: "8-2",
    sessions: 8,
    subjects: 2,
    title: "월 8회",
    subtitle: "2과목 · 주 2회",
    features: [
      "과목별 주 2회 수업 (50분)",
      "선생님 2명 배정",
      "학습 진도·과제 관리",
      "AI 질답 횟수 2배 제공",
    ],
    recommended: true,
  },
];

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  amount → planId 역매핑 (결제 검증 진실의 원천)
 *  v2 8개 + 레거시 4개 = 12개 유일 금액.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** LEGACY — 2026-07 이전 결제(PaymentCompletion/Subscription) 레코드 재인식용. 신규 발급 금지. */
const LEGACY_AMOUNT_TO_ID: Map<number, string> = new Map([
  [calculatePlanTotal(4, 1), "4-1"], // 400,000
  [calculatePlanTotal(8, 1), "8-1"], // 720,000
  [calculatePlanTotal(4, 2), "4-2"], // 800,000
  [calculatePlanTotal(8, 2), "8-2"], // 1,440,000
]);

/**
 * 결제 금액으로 플랜 ID 도출. v2 8개 금액 우선 매칭 → 없으면 legacy 4개 폴백.
 * 유효 금액이 아니면 null. 웹훅/complete 라우트가 payment integrity 게이트로 사용.
 */
export function planIdFromAmount(amount: number): string | null {
  const v2 = V2_AMOUNT_TO_ID.get(amount);
  if (v2) return v2;
  // LEGACY — 예전 amount로 완료된 결제 재확인/재시도용.
  const legacy = LEGACY_AMOUNT_TO_ID.get(amount);
  if (legacy) return legacy;
  return null;
}

/** planId 목록을 노출 (v2 + legacy). normalizePlan 등 whitelist 용도. */
export function allKnownPlanIds(): string[] {
  return [
    ...PRICING_PLANS_V2.map((p) => p.id),
    ...PRICING_PLANS.map((p) => p.id),
  ];
}
