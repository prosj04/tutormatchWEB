"use client";


import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import type { PricingPlanItem } from "@/lib/pricing-cms";
import {
  MONTHS_PER_BILLING_CYCLE_WEEKS,
  PLAN_INCLUDES,
  type PricingPlanV2,
  type PricingSchoolTier,
} from "@/lib/pricing-plans";

function formatNumber(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "주 N회 · N분 · 회당 N원" — 시안 .punit 라인. */
function planUnitLine(plan: PricingPlanV2): string {
  const minutes = plan.hoursPerLesson * 60;
  const lessonsPerMonth = plan.weekly * MONTHS_PER_BILLING_CYCLE_WEEKS;
  const perLesson = Math.round(plan.priceKrw / lessonsPerMonth);
  return `주 ${plan.weekly}회 · ${minutes}분 · 회당 ${formatNumber(perLesson)}원`;
}

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

  if (variant === "home") {
    const homeCards = items.map((item) => {
      const plan = item.plan;
      const isRec = plan.weekly === 2 && plan.hoursPerLesson === 2;
      const priceFormatted = formatNumber(plan.priceKrw);
      const displayTitle = item.title ?? `주 ${plan.weekly}회 · ${plan.hoursPerLesson}시간`;
      const features = [...(item.features ?? []), ...PLAN_INCLUDES.slice(0, 2)];
      return (
        <ConcordReveal key={plan.id} as="article" className={`lp2-pcard${isRec ? " rec" : ""}`}>
          {isRec ? <span className="lp2-pcard-badge">{c("card_badge_recommend", "추천")}</span> : null}
          <div className="lp2-pcard-name">{displayTitle}</div>
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
    return <div className="lp2-price-duo">{homeCards}</div>;
  }

  const cards = items.map((item) => {
    const plan = item.plan;
    const isRec = plan.weekly === 2 && plan.hoursPerLesson === 2;
    const priceFormatted = formatNumber(plan.priceKrw);
    const tierLabel = plan.tier === "middle" ? "중등" : "고등";
    const displayTitle = item.title ?? `주 ${plan.weekly}회`;
    const unitLine = item.subtitle || planUnitLine(plan);
    return (
      <ConcordReveal key={plan.id} as="article" className={`card price-card${isRec ? " rec" : ""}`}>
        {isRec ? <span className="rec-badge">{c("card_badge_recommend", "추천")}</span> : null}
        <div className="ptag">{c("card_ptag", `1:1 맞춤 과외 · ${tierLabel}`)}</div>
        <div className="pname">{displayTitle}</div>
        <div className="price">
          {priceFormatted}
          <small>{c("card_per_month", "원 / 월")}</small>
        </div>
        <div className="punit">{unitLine}</div>
        <ul className="pfeat">
          {(item.features ?? []).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <ConsultationApplyButton
          className={`btn btn-block${isRec ? " btn-acc" : " btn-ghost"}`}
          source={`${sourcePrefix}_${plan.id}`}
        >
          {c("card_btn_start", "이 플랜으로 시작")}
        </ConsultationApplyButton>
      </ConcordReveal>
    );
  });

  return <div className="price-grid">{cards}</div>;
}
