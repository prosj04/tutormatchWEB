"use client";

import { useMemo } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ConcordSubpageCta } from "@/components/concord/ConcordSubpageCta";
import { PricingPlanCards } from "@/components/pricing/PricingPlanCards";
import { formatCmsMultiline, getCmsSectionValue, parseCmsVisibility } from "@/lib/cms-page-defaults";
import { buildVisiblePricingPlanItems } from "@/lib/pricing-cms";
import { usePricingSchoolTier } from "@/lib/pricing-tier-preference";
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
  const assureVisible = parseCmsVisibility(siteContent?.["pricing_page"]?.["assure_visible"], true);
  const headerSubtext = get(
    "header_subtext",
    "모든 플랜에 학습 리포트·매니저 관리·강사 첨삭이 포함됩니다. 첫 배정 선생님이 맞지 않으면 추가 비용 없이 재매칭합니다.",
  );

  return (
    <main>
      <ConcordPageHead
        eyebrow={
          <CmsEdit active={isEditMode} section="pricing_page" cmsKey="header_eyebrow" type="text">
            {get("header_eyebrow", "Plans")}
          </CmsEdit>
        }
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
              {get("tier_middle_label", "중등")}
            </button>
            <button
              type="button"
              className={tier === "high" ? "on" : undefined}
              data-tier-tab="high"
              onClick={() => setTier("high")}
            >
              {get("tier_high_label", "고등")}
            </button>
          </ConcordReveal>

          <div data-tier={tier}>
            <PricingPlanCards items={items} tier={tier} sourcePrefix="pricing_plan" />
          </div>

          {(assureVisible || isEditMode) && (
          <ConcordReveal className="assure" as="div">
            <ShieldIcon />
            <span>
              <CmsEdit active={isEditMode} section="pricing_page" cmsKey="assure_pre" type="text">
                {get("assure_pre", "처음 배정된 선생님이 맞지 않으면 ")}
              </CmsEdit>
              <strong>
                <CmsEdit active={isEditMode} section="pricing_page" cmsKey="assure_strong" type="text">
                  {get("assure_strong", "추가 비용 없이 다시 매칭")}
                </CmsEdit>
              </strong>
              <CmsEdit active={isEditMode} section="pricing_page" cmsKey="assure_post" type="text">
                {get("assure_post", "해 드립니다. 수업료는 월 단위, 언제든 조정 가능합니다.")}
              </CmsEdit>
            </span>
          </ConcordReveal>
          )}
        </div>
      </section>

      <ConcordSubpageCta
        siteContent={siteContent}
        section="pricing_page"
        isEditMode={isEditMode}
        source="pricing_page_cta"
      />
    </main>
  );
}
