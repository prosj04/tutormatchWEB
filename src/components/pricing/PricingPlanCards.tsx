"use client";


import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import type { PricingPlanItem } from "@/lib/pricing-cms";
import { PLAN_INCLUDES, type PricingSchoolTier } from "@/lib/pricing-plans";

/**
 * 요금제 카드 v3 — 황금비(1:1.618) 헤어라인 카드, 세리프 가격.
 * 추천은 컬러 배지 대신 1px 잉크 보더 + 작은 텍스트 라벨. 가격·표기는 코드값 그대로.
 * props·export 시그니처는 v2와 동일(홈·/pricing 공용).
 */
export function PricingPlanCards({
  items,
  sourcePrefix,
  variant = "full",
  labels = {},
}: {
  items: PricingPlanItem[];
  tier: PricingSchoolTier;
  sourcePrefix: string;
  variant?: "full" | "home";
  /** pricing_page CMS 라벨 (없으면 기본값) */
  labels?: Record<string, string>;
}) {
  const c = (key: string, fallback: string) => labels[key] ?? fallback;

  const cards = items.map((item) => {
    const plan = item.plan;
    const isRec = plan.weekly === 2 && plan.hoursPerLesson === 2;
    const priceFormatted = plan.priceKrw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const displayTitle = item.title ?? `주 ${plan.weekly}회 · ${plan.hoursPerLesson}시간`;
    const features = [...(item.features ?? []), ...PLAN_INCLUDES.slice(0, 2)];
    return (
      <ConcordReveal key={plan.id} as="article" className={`lx-pcard${isRec ? " rec" : ""}`}>
        {isRec ? <span className="lx-pcard-rec">{c("card_badge_recommend", "추천")}</span> : null}
        <div className="lx-pcard-name">{displayTitle}</div>
        {item.subtitle ? <div className="lx-pcard-sub">{item.subtitle}</div> : null}
        <div className="lx-pcard-price">
          {priceFormatted}
          <small>{c("card_per_month", "원/1개월(4주)")}</small>
        </div>
        <ul className="lx-pcard-feat">
          {features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <div className="lx-pcard-cta">
          <ConsultationApplyButton
            className={`btn btn-block btn-sm${isRec ? " btn-acc" : " btn-ghost"}`}
            source={`${sourcePrefix}_${plan.id}`}
          >
            {c("card_btn_start", "이 플랜으로 시작")}
          </ConsultationApplyButton>
        </div>
      </ConcordReveal>
    );
  });

  if (variant === "home") {
    return <div className="lx-pcard-row">{cards}</div>;
  }
  return <div className="lx-pcard-grid">{cards}</div>;
}
