import { formatKRW } from "@/lib/format-won";

export type SessionPlan = 4 | 8;
export type SubjectCount = 1 | 2;

/** 주 1회(월 4회) 회당 10만원, 주 2회 이상(월 8회) 회당 9만원 */
export const RATE_WEEKLY_ONCE = 100_000;
export const RATE_WEEKLY_TWICE_OR_MORE = 90_000;

export const CONSULTATION_HREF = "/dashboard/consultation";

export function getRatePerSession(sessions: SessionPlan): number {
  return sessions === 4 ? RATE_WEEKLY_ONCE : RATE_WEEKLY_TWICE_OR_MORE;
}

export function calculatePlanTotal(sessions: SessionPlan, subjects: SubjectCount): number {
  return getRatePerSession(sessions) * sessions * subjects;
}

export function formatPlanPrice(sessions: SessionPlan, subjects: SubjectCount): string {
  return formatKRW(calculatePlanTotal(sessions, subjects));
}

export function buildCheckoutHref(sessions: SessionPlan, subjects: SubjectCount): string {
  const params = new URLSearchParams({
    sessions: String(sessions),
    subjects: String(subjects),
    tutor: "1",
  });
  return `/checkout?${params.toString()}`;
}

/** 상담 대기 없이 즉시 등록 (대표 매니저 배정) */
export function buildInstantSignupHref(
  sessions: SessionPlan,
  subjects: SubjectCount,
): string {
  const params = new URLSearchParams({
    signup: "1",
    instant: "1",
    sessions: String(sessions),
    subjects: String(subjects),
  });
  return `/?${params.toString()}`;
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

/** 홈 미리보기용 (1과목 플랜만) */
export const HOME_PRICING_PLANS = PRICING_PLANS.filter((p) => p.subjects === 1);
