"use client";

import { useMemo } from "react";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { PublicCardLine, PublicCardMultiline } from "@/components/landing/PublicCardText";
import { buildCtaBenefitCards } from "@/lib/cta-benefits";
import { composeCmsTypographyClass, getCmsSectionValue, getCmsSpacing } from "@/lib/cms-page-defaults";
import { PUBLIC_CARD } from "@/lib/public-card-sizes";

type HomeConsultationCtaSectionProps = {
  siteContent?: Record<string, Record<string, string>>;
  isEditMode?: boolean;
};

/** 홈 하단 파란 상담 혜택 섹션 — CMS `cta` 섹션(홈 탭)과 연동 */
export function HomeConsultationCtaSection({ siteContent, isEditMode = false }: HomeConsultationCtaSectionProps) {
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "cta", key, fallback);
  const sp = (key: string) => getCmsSpacing(siteContent, key);

  const benefitCards = useMemo(() => buildCtaBenefitCards(siteContent), [siteContent]);

  return (
    <section
      id="consultation"
      className="scroll-mt-24 bg-primary py-16 sm:py-20 md:min-h-[88vh] md:py-28 lg:py-36"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col justify-center px-4 sm:px-5 md:min-h-[calc(88vh-10rem)]">
        <CmsEdit active={isEditMode} section="cta" cmsKey="headline" type="text">
          <h2
            className={`leading-tight tracking-[-0.03em] text-white ${composeCmsTypographyClass(
              siteContent,
              "cta",
              "headline",
              "text-[clamp(1.75rem,5vw,3.5rem)]",
              "font-black",
            )}`}
          >
            {get("headline", "지금 신청하면 받을 수 있는 혜택이에요")}
          </h2>
        </CmsEdit>
        <CmsEdit active={isEditMode} section="cta" cmsKey="subtext" type="text">
          <p
            className={`mt-4 max-w-2xl leading-relaxed text-white/85 ${composeCmsTypographyClass(
              siteContent,
              "cta",
              "subtext",
              "text-base",
              "font-medium",
            )}`}
          >
            {get("subtext", "서울·분당 방문 수업 가능 · 무료 상담 1회 · 매니저 직접 배정 · 학습 리포트 무료 제공")}
          </p>
        </CmsEdit>
        <CmsEdit active={isEditMode} section="spacing" cmsKey="cta_cards" type="spacing">
        <div
          style={sp("cta_cards")}
          className={`mt-12 grid grid-cols-2 gap-4 sm:gap-5 md:mt-14 md:gap-6 ${
            benefitCards.length > 4 ? "lg:grid-cols-3 xl:grid-cols-6" : "lg:grid-cols-4"
          }`}
        >
          {benefitCards.map((b) => (
            <div
              key={b.slot}
              className={`flex ${PUBLIC_CARD.ctaBenefitMinHeight} min-w-0 flex-col rounded-[20px] border border-sky-200/40 bg-sky-200/25 p-4 backdrop-blur-sm sm:p-6 md:p-8`}
            >
              <CmsEdit active={isEditMode} section="cta" cmsKey={`cta_box_${b.slot}_title`} type="text">
                <PublicCardLine className="text-base font-black text-white sm:text-lg">{b.title}</PublicCardLine>
              </CmsEdit>
              <CmsEdit active={isEditMode} section="cta" cmsKey={`cta_box_${b.slot}_desc`} type="text">
                <PublicCardLine className="mt-2 text-xs font-bold text-white/90 sm:mt-3 sm:text-sm">{b.desc}</PublicCardLine>
              </CmsEdit>
              <CmsEdit active={isEditMode} section="cta" cmsKey={`cta_box_${b.slot}_detail`} type="text">
                <div className="mt-3 min-w-0 flex-1 sm:mt-4">
                  <PublicCardMultiline
                    text={b.detail}
                    lineClassName="text-xs font-medium text-white/75 sm:text-sm"
                  />
                </div>
              </CmsEdit>
            </div>
          ))}
        </div>
        </CmsEdit>
        <CmsEdit active={isEditMode} section="spacing" cmsKey="cta_button" type="spacing">
        <div style={sp("cta_button")} className="mt-12 flex justify-center md:mt-14">
          <CmsEdit active={isEditMode} section="cta" cmsKey="button" type="text">
            <ConsultationApplyButton className="inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-base font-black text-primary shadow-lg transition hover:bg-neutral-10">
              {get("button", "무료 상담 신청하기")}
            </ConsultationApplyButton>
          </CmsEdit>
        </div>
        </CmsEdit>
      </div>
    </section>
  );
}
