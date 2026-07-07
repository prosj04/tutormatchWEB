"use client";

import Link from "next/link";

import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import type { PricingPlanItem } from "@/lib/pricing-cms";
import { buildCheckoutHrefV2, PLAN_INCLUDES, type PricingSchoolTier } from "@/lib/pricing-plans";

export function PricingPlanCards({
  items,
  tier,
  sourcePrefix,
  variant = "full",
}: {
  items: PricingPlanItem[];
  tier: PricingSchoolTier;
  sourcePrefix: string;
  variant?: "full" | "home";
}) {
  const tierLabel = tier === "middle" ? "중등" : "고등";

  const cards = items.map((item) => {
    const plan = item.plan;
    const isRec = plan.weekly === 2 && plan.hoursPerLesson === 2;
    const priceFormatted = plan.priceKrw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const displayTitle = item.title ?? `주 ${plan.weekly}회 · 회당 ${plan.hoursPerLesson}시간`;
    const displaySubtitle = item.subtitle ?? `월 ${plan.monthlyHours}시간`;
    const features = [...(item.features ?? []), ...PLAN_INCLUDES.slice(0, 2)];
    return (
      <ConcordReveal key={plan.id} as="article" className={`lp2-pcard${isRec ? " rec" : ""}`}>
        {isRec ? <span className="lp2-pcard-badge">추천</span> : null}
        <div className="lp2-pcard-name">{displayTitle}</div>
        <div className="lp2-pcard-sub">
          {displaySubtitle} · {tierLabel}
        </div>
        <div className="lp2-pcard-price">
          {priceFormatted}
          <small>원 / 월</small>
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
            이 플랜으로 시작
          </ConsultationApplyButton>
          {variant === "full" ? (
            <Link className="lp2-pcard-pay" href={buildCheckoutHrefV2(plan.id)}>
              바로 결제하기 →
            </Link>
          ) : null}
        </div>
      </ConcordReveal>
    );
  });

  if (variant === "home") {
    return <div className="lp2-price-duo">{cards}</div>;
  }
  return <div className="lp2-pcard-grid">{cards}</div>;
}
