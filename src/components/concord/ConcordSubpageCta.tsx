"use client";

import type { ReactNode } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { KakaoConsultButton } from "@/components/consultation/KakaoConsultButton";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { getCmsSectionValue, parseCmsVisibility } from "@/lib/cms-page-defaults";
import type { GroupedSiteContent } from "@/lib/site-content";

type ConcordSubpageCtaProps = {
  siteContent?: GroupedSiteContent;
  section?: string;
  isEditMode?: boolean;
  keyPrefix?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
  source?: string;
};

/** 서브페이지 하단 상담 유도 밴드. concord.css의 기존 sec/wrap/card/btn 클래스만 사용. */
export function ConcordSubpageCta({
  siteContent,
  section,
  isEditMode = false,
  keyPrefix = "cta",
  title = "지금 무료 상담으로 시작해 보세요",
  description = "학년·과목·목표만 알려주시면 매니저가 하루 안에 맞춤 플랜을 제안합니다.",
  buttonLabel = "무료 상담 신청",
  source = "subpage_cta",
}: ConcordSubpageCtaProps) {
  const get = (key: string, fallback: string) =>
    section ? getCmsSectionValue(siteContent, section, `${keyPrefix}_${key}`, fallback) : fallback;

  const resolvedTitle = get("title", title);
  const resolvedDescription = get("subtext", description);
  const resolvedButton = get("button", buttonLabel);
  const visible = parseCmsVisibility(
    section ? siteContent?.[section]?.[`${keyPrefix}_visible`] : undefined,
    true,
  );

  if (!visible && !isEditMode) return null;

  const wrap = (key: string, node: ReactNode) =>
    section ? (
      <CmsEdit active={isEditMode} section={section} cmsKey={`${keyPrefix}_${key}`} type="text">
        {node}
      </CmsEdit>
    ) : (
      node
    );

  return (
    <section className="sec-sm">
      <div className="wrap">
        <ConcordReveal
          className="card"
          style={{
            textAlign: "center",
            padding: "clamp(28px, 4vw, 44px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: "clamp(20px, 2.4vw, 26px)", lineHeight: 1.3 }}>
            {wrap("title", resolvedTitle)}
          </h2>
          {resolvedDescription ? (
            <p style={{ margin: 0, color: "var(--mut-2)", fontSize: 15, maxWidth: 560 }}>
              {wrap("subtext", resolvedDescription)}
            </p>
          ) : null}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <ConsultationApplyButton className="btn btn-acc btn-lg" source={source}>
              {wrap("button", resolvedButton)}
            </ConsultationApplyButton>
            <KakaoConsultButton source={source} className="kakao-btn" />
          </div>
        </ConcordReveal>
      </div>
    </section>
  );
}
