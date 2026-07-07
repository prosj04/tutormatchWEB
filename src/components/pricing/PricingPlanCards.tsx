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

  if (variant === "home") {
    return (
      <div className="lp2-price-duo">
        {items.map((item) => {
          const plan = item.plan;
          const isRec = plan.weekly === 2 && plan.hoursPerLesson === 2;
          const priceFormatted = plan.priceKrw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          const displayTitle = item.title ?? `주 ${plan.weekly}회 · 회당 ${plan.hoursPerLesson}시간`;
          const displaySubtitle = item.subtitle ?? `월 ${plan.monthlyHours}시간`;
          return (
            <ConcordReveal key={plan.id} as="article" className={`lp2-pcard${isRec ? " rec" : ""}`}>
              {isRec ? <span className="lp2-pcard-badge">추천</span> : null}
              <div>
                <div className="lp2-pcard-name">{displayTitle}</div>
                <div className="lp2-pcard-sub">
                  {displaySubtitle} · {tierLabel}
                </div>
              </div>
              <div className="lp2-pcard-price">
                {priceFormatted}
                <small>원 / 월</small>
              </div>
              <ConsultationApplyButton
                className={`lp2-btn lp2-btn-sm${isRec ? " lp2-btn-acc" : " lp2-btn-ghost"}`}
                source={`${sourcePrefix}_${plan.id}`}
              >
                이 플랜으로 시작
              </ConsultationApplyButton>
            </ConcordReveal>
          );
        })}
      </div>
    );
  }

  return (
    <div className="price-grid">
      {items.map((item) => {
        const plan = item.plan;
        const isRec = plan.weekly === 2 && plan.hoursPerLesson === 2;
        const priceFormatted = plan.priceKrw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const displayTitle = item.title ?? `주 ${plan.weekly}회 · 회당 ${plan.hoursPerLesson}시간`;
        const displaySubtitle = item.subtitle ?? `월 ${plan.monthlyHours}시간`;
        return (
          <ConcordReveal key={plan.id} as="article" className={`card price-card${isRec ? " rec" : ""}`}>
            {isRec ? <span className="rec-badge">추천</span> : null}
            <div className="ptag">1:1 맞춤 과외 · {tierLabel}</div>
            <div className="pname">{displayTitle}</div>
            <div className="punit" style={{ marginBottom: 4 }}>{displaySubtitle}</div>
            <div className="price">
              {priceFormatted}
              <small>원 / 월</small>
            </div>
            <ul className="pfeat">
              {(item.features ?? []).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>
                모든 플랜 공통 포함
              </p>
              <ul className="pfeat" style={{ fontSize: "0.875rem" }}>
                {PLAN_INCLUDES.map((inc) => (
                  <li key={inc}>{inc}</li>
                ))}
              </ul>
            </div>
            <ConsultationApplyButton
              className={`btn btn-block${isRec ? " btn-acc" : " btn-ghost"}`}
              source={`${sourcePrefix}_${plan.id}`}
            >
              이 플랜으로 시작
            </ConsultationApplyButton>
            <Link
              className="punit"
              href={buildCheckoutHrefV2(plan.id)}
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 8,
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.55)",
                textDecoration: "underline",
              }}
            >
              바로 결제하기 →
            </Link>
          </ConcordReveal>
        );
      })}
    </div>
  );
}
