"use client";


import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import type { PricingPlanItem } from "@/lib/pricing-cms";
import { PLAN_INCLUDES, type PricingSchoolTier } from "@/lib/pricing-plans";

export function PricingPlanCards({
  items,
  tier,
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
  const tierLabel = tier === "middle" ? c("tier_middle_label", "중등") : c("tier_high_label", "고등");

  const cards = items.map((item) => {
    const plan = item.plan;
    const isRec = plan.weekly === 2 && plan.hoursPerLesson === 2;
    const priceFormatted = plan.priceKrw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const displayTitle = item.title ?? `주 ${plan.weekly}회 · ${plan.hoursPerLesson}시간`;
    const features = [...(item.features ?? []), ...PLAN_INCLUDES.slice(0, 2)];
    return (
      <ConcordReveal key={plan.id} as="article" className={`lp2-pcard${isRec ? " rec" : ""}`}>
        {isRec ? <span className="lp2-pcard-badge">{c("card_badge_recommend", "추천")}</span> : null}
        <div className="lp2-pcard-name">
          {displayTitle}
          <span className="lp2-pcard-tier">{tierLabel}</span>
        </div>
        {item.subtitle ? <div className="lp2-pcard-sub">{item.subtitle}</div> : null}
        <div className="lp2-pcard-price">
          {priceFormatted}
          <small>{c("card_per_month", "원/1개월(4주)")}</small>
        </div>
        <ul className="lp2-pcard-feat">
          {features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <div className="lp2-pcard-cta">
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
    return <div className="lp2-price-duo">{cards}</div>;
  }
  return <div className="lp2-pcard-grid">{cards}</div>;
}
