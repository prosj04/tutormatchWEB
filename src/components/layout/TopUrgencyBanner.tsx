"use client";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { getCmsSectionValue, parseCmsVisibility } from "@/lib/cms-page-defaults";
import type { GroupedSiteContent } from "@/lib/site-content";

const SECTION = "site_banner";

/** 헤더 위 얇은 안내 배너. CMS site_banner 섹션으로 on/off·문구 제어. */
export function TopUrgencyBanner({ siteContent }: { siteContent?: GroupedSiteContent }) {
  const enabled = parseCmsVisibility(siteContent?.[SECTION]?.enabled, true);
  if (!enabled) return null;

  const text = getCmsSectionValue(
    siteContent,
    SECTION,
    "text",
    "상담은 신청 순서대로 안내드려요",
  );
  const ctaLabel = getCmsSectionValue(
    siteContent,
    SECTION,
    "cta_label",
    "이번 주 상담 가능 시간 확인하기 →",
  );

  return (
    <div className="site-banner" role="region" aria-label="안내 배너">
      <span className="site-banner-text">{text}</span>
      <ConsultationApplyButton className="site-banner-cta" source="top_banner">
        {ctaLabel}
      </ConsultationApplyButton>
    </div>
  );
}
