"use client";

import Link from "next/link";
import { useMemo } from "react";

import { PricingPlanCards } from "@/components/pricing/PricingPlanCards";
import type { LandingCmsContent } from "@/lib/cms";
import { buildVisiblePricingPlanItems } from "@/lib/pricing-cms";
import { usePricingSchoolTier } from "@/lib/pricing-tier-preference";
import type { LandingView } from "./landing-view";

/** 요금 — 왼쪽 제목·보장·각주, 오른쪽 밑줄 탭 + 한 줄 카드(두 줄로 감싸지 않음) */
export function PricingEditorial({
  view,
  siteContent,
}: {
  view: LandingView;
  siteContent?: LandingCmsContent["siteContent"];
}) {
  const { getCmsValue, kickers, sectionTitles, uiLabels } = view;
  const [tier, setTier] = usePricingSchoolTier();

  const homePricingDuo = useMemo(() => {
    const all = buildVisiblePricingPlanItems(siteContent, tier);
    const rec = all.find((i) => i.plan.weekly === 2 && i.plan.hoursPerLesson === 2);
    if (!rec) return all.slice(0, 2);
    const other = all.find((i) => i !== rec);
    return other ? [other, rec] : [rec];
  }, [siteContent, tier]);

  return (
    <section id="pricing" className="sec ruled">
      <div className="wrap">
        <div className="lx-price">
          <div className="lx-price-left">
            <span className="eyebrow reveal lx-fast">{kickers.plans}</span>
            <h2 className="h2 reveal lx-slow" style={{ whiteSpace: "pre-line" }}>
              {sectionTitles.plans}
            </h2>
            <div className="lx-price-guar reveal lx-fast">
              <p>
                <span className="lx-ok" aria-hidden="true">
                  ✓
                </span>
                {getCmsValue("guarantee", "item1", "첫 수업이 맞지 않으면 100% 환불")}
              </p>
              <p>
                <span className="lx-ok" aria-hidden="true">
                  ✓
                </span>
                {getCmsValue("guarantee", "item2", "선생님 교체 비용 0원")}
              </p>
            </div>
            <Link href="/refund" className="lx-note-link">
              *환불정책 참고
            </Link>
            <p style={{ marginTop: 18 }}>
              <Link href="/pricing" className="link">
                {uiLabels.viewAllPricing}
              </Link>
            </p>
          </div>

          <div className="lx-price-right reveal lx-fast">
            <div className="tier-tabs" role="group" aria-label="학년 선택">
              <button
                type="button"
                className={tier === "middle" ? "on" : undefined}
                onClick={() => setTier("middle")}
              >
                {uiLabels.tierMiddle}
              </button>
              <button
                type="button"
                className={tier === "high" ? "on" : undefined}
                onClick={() => setTier("high")}
              >
                {uiLabels.tierHigh}
              </button>
            </div>

            <div data-tier={tier}>
              <PricingPlanCards
                items={homePricingDuo}
                tier={tier}
                sourcePrefix="home_pricing"
                variant="home"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
