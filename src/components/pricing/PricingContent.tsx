"use client";

import Link from "next/link";
import { useMemo } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { formatCmsMultiline, getCmsSectionValue } from "@/lib/cms-page-defaults";
import { buildVisiblePricingPlanItems } from "@/lib/pricing-cms";
import { usePricingSchoolTier } from "@/lib/pricing-tier-preference";
import { buildCheckoutHref, PLAN_INCLUDES } from "@/lib/pricing-plans";
import type { GroupedSiteContent } from "@/lib/site-content";

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function cmsTitleLines(text: string) {
  const lines = formatCmsMultiline(text).split("\n").filter(Boolean);
  if (lines.length <= 1) return text;
  return lines.map((line, i) => (
    <span key={line}>
      {line}
      {i < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

type PricingContentProps = {
  siteContent?: GroupedSiteContent;
  isEditMode?: boolean;
};

export function PricingContent({ siteContent, isEditMode = false }: PricingContentProps) {
  const [tier, setTier] = usePricingSchoolTier();
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "pricing_page", key, fallback);

  const items = useMemo(
    () => buildVisiblePricingPlanItems(siteContent, tier),
    [siteContent, tier],
  );

  const headerTitle = get("header_title", "투명한 요금,\n꼭 맞는 1:1 과외");
  const headerSubtext = get(
    "header_subtext",
    "모든 플랜에 학습 리포트·매니저 관리·강사 첨삭이 포함됩니다. 첫 배정 선생님이 맞지 않으면 추가 비용 없이 재매칭합니다.",
  );

  return (
    <main>
      <ConcordPageHead
        eyebrow="Plans"
        title={
          <CmsEdit active={isEditMode} section="pricing_page" cmsKey="header_title" type="text">
            {cmsTitleLines(headerTitle)}
          </CmsEdit>
        }
        description={
          <CmsEdit active={isEditMode} section="pricing_page" cmsKey="header_subtext" type="text">
            {headerSubtext}
          </CmsEdit>
        }
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <ConcordReveal className="tier-tabs" role="group" aria-label="학년 선택">
            <button
              type="button"
              className={tier === "middle" ? "on" : undefined}
              data-tier-tab="middle"
              onClick={() => setTier("middle")}
            >
              중등
            </button>
            <button
              type="button"
              className={tier === "high" ? "on" : undefined}
              data-tier-tab="high"
              onClick={() => setTier("high")}
            >
              고등
            </button>
          </ConcordReveal>

          <div data-tier={tier}>
            <div className="price-grid">
              {items.map((item, index) => {
                const isRec = index === 1 || item.plan.sessions === 8;
                const priceDigits = (item.price ?? "").replace(/[^\d]/g, "");
                const priceFormatted = priceDigits
                  ? priceDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  : "";
                const tierLabel = tier === "middle" ? "중등" : "고등";
                return (
                  <ConcordReveal
                    key={item.plan.id}
                    as="article"
                    className={`card price-card${isRec ? " rec" : ""}`}
                  >
                    {isRec ? <span className="rec-badge">추천</span> : null}
                    <div className="ptag">
                      1:1 맞춤 과외 · {tierLabel}
                    </div>
                    <div className="pname">{item.title ?? item.plan.title}</div>
                    <div className="price">
                      {priceFormatted}
                      <small>원 / 월</small>
                    </div>
                    <div className="punit">{item.subtitle ?? item.plan.subtitle}</div>
                    <ul className="pfeat">
                      {(item.features ?? item.plan.features).map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>
                        모든 플랜 공통 포함
                      </p>
                      <ul className="pfeat" style={{ fontSize: "0.875rem" }}>
                        {PLAN_INCLUDES.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      className={`btn btn-block${isRec ? " btn-acc" : " btn-ghost"}`}
                      href={buildCheckoutHref(item.plan.sessions, item.plan.subjects)}
                    >
                      이 플랜으로 시작
                    </Link>
                  </ConcordReveal>
                );
              })}
            </div>
          </div>

          <ConcordReveal className="assure" as="div">
            <ShieldIcon />
            <span>
              처음 배정된 선생님이 맞지 않으면 <strong>추가 비용 없이 다시 매칭</strong>해 드립니다. 수업료는 월
              단위, 언제든 조정 가능합니다.
            </span>
          </ConcordReveal>
        </div>
      </section>
    </main>
  );
}
