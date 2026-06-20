"use client";

import { useMemo } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { HomeConsultationCtaSection } from "@/components/landing/HomeConsultationCtaSection";
import { FloatingConsultationCue } from "@/components/pricing/FloatingConsultationCue";
import { PricingPlansGrid } from "@/components/pricing/PricingPlansGrid";
import { PricingTierToggle } from "@/components/pricing/PricingTierToggle";
import { composeCmsTypographyClass, getCmsSpacing, getCmsSectionValue } from "@/lib/cms-page-defaults";
import { buildVisiblePricingPlanItems } from "@/lib/pricing-cms";
import { usePricingSchoolTier } from "@/lib/pricing-tier-preference";

const FAQ_FALLBACK = [
  {
    q: "수업 시간과 환불 규정은 어떻게 되나요?",
    a: "1회 수업은 50분 기준이며, 개강 전 결제 취소는 전액 환불됩니다. 개강 후에는 잔여 횟수에 비례하여 산정되며, 세부 약관은 계약서에 명시됩니다.",
  },
  {
    q: "강사 변경이 가능한가요?",
    a: "첫 2회 수업 이내에만 동일 요금제 범위에서 1회에 한해 변경이 가능합니다. 이후에는 매니저와 별도 협의가 필요합니다.",
  },
  {
    q: "AI 질답은 어떻게 이용하나요?",
    a: "가입 시 발급되는 학습 계정으로 24시간 질문이 가능하며, 강사 첨삭 횟수는 선택하신 플랜에 따라 월 4회 또는 무제한 혜택이 적용됩니다.",
  },
  {
    q: "결제 수단은 무엇이 있나요?",
    a: "체크아웃 페이지에서 카드, 간편결제 등 토스페이먼츠에서 제공하는 수단을 선택하실 수 있습니다.",
  },
];

export function PricingContent({
  siteContent,
  isEditMode = false,
}: {
  siteContent?: Record<string, Record<string, string>>;
  isEditMode?: boolean;
}) {
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "pricing_page", key, fallback);

  const [pricingTier, setPricingTier] = usePricingSchoolTier();

  const planItems = useMemo(
    () => buildVisiblePricingPlanItems(siteContent, pricingTier),
    [siteContent, pricingTier],
  );

  const faqs = FAQ_FALLBACK.map((item, index) => {
    const n = index + 1;
    return {
      q: get(`faq${n}_q`, item.q),
      a: get(`faq${n}_a`, item.a),
    };
  });

  const sp = (key: string) => getCmsSpacing(siteContent, key);

  return (
    <div className="bg-neutral-10 pb-0">
      <CmsEdit active={isEditMode} section="spacing" cmsKey="pricing_header" type="spacing">
      <div className="border-b border-neutral-20 bg-white py-12 md:py-16 lg:py-20" style={sp("pricing_header")}>
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-5">
          <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="min-w-0 lg:flex-1">
              <CmsEdit active={isEditMode} section="pricing_page" cmsKey="kicker" type="text">
                <p className="text-sm font-black uppercase tracking-wider text-primary">
                  {get("kicker", "Plans")}
                </p>
              </CmsEdit>
              <CmsEdit active={isEditMode} section="pricing_page" cmsKey="header_title" type="text">
                <h1
                  className={`mt-3 whitespace-pre-line leading-tight tracking-[-0.04em] text-neutral-100 sm:mt-4 ${composeCmsTypographyClass(
                    siteContent,
                    "pricing_page",
                    "header_title",
                    "text-[clamp(1.75rem,5vw,3.5rem)]",
                    "font-black",
                  )}`}
                >
                  {get("header_title", "1:1 맞춤 과외,\n월 40만원부터")}
                </h1>
              </CmsEdit>
            </div>
            <CmsEdit active={isEditMode} section="pricing_page" cmsKey="header_subtext" type="text">
              <p className="min-w-0 whitespace-pre-line text-base font-medium leading-relaxed text-neutral-80 sm:text-lg lg:max-w-md lg:shrink-0 lg:text-right xl:max-w-lg">
                {get(
                  "header_subtext",
                  "1과목·2과목(선생님 2명) 패키지를 선택하세요.",
                )}
              </p>
            </CmsEdit>
          </div>
        </div>
      </div>
      </CmsEdit>

      <CmsEdit active={isEditMode} section="spacing" cmsKey="pricing_plans" type="spacing">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-5 md:py-20 lg:py-24" style={sp("pricing_plans")}>
        {planItems.length > 0 ? (
          <div>
            <PricingTierToggle
              value={pricingTier}
              onChange={setPricingTier}
              className="mb-6 md:mb-8"
            />
            <PricingPlansGrid items={planItems} variant="page" />
          </div>
        ) : (
          <p className="rounded-2xl border border-neutral-20 bg-white px-6 py-10 text-center text-sm font-medium text-neutral-80">
            표시로 설정된 요금제 카드가 없습니다. 사이트 콘텐츠 관리에서 요금제 카드를 켜 주세요.
          </p>
        )}

        <FloatingConsultationCue
          scrollTargetId="consultation"
          showChevron
          revealOnScroll
          className="pt-14 pb-4 md:pt-20 md:pb-6"
        />
      </div>
      </CmsEdit>

      <CmsEdit active={isEditMode} section="spacing" cmsKey="pricing_faq_sec" type="spacing">
      <section className="mx-auto w-full max-w-[1200px] px-4 pb-12 sm:px-5 md:pb-20 lg:pb-24" style={sp("pricing_faq_sec")}>
        <CmsEdit active={isEditMode} section="pricing_page" cmsKey="faq_title" type="text">
          <h2 className="text-2xl font-black text-neutral-100 sm:text-3xl md:text-5xl">
            {get("faq_title", "자주 묻는 질문")}
          </h2>
        </CmsEdit>
        <CmsEdit active={isEditMode} section="pricing_page" cmsKey="faq_kicker" type="text">
          <p className="mt-2 text-sm font-bold text-neutral-80">{get("faq_kicker", "FAQ")}</p>
        </CmsEdit>
        <div className="mt-8 divide-y divide-neutral-20 overflow-hidden rounded-2xl border border-neutral-20 bg-white sm:mt-10 sm:rounded-[28px]">
          {faqs.map((item, index) => {
            const n = index + 1;
            return (
            <div key={item.q} className="px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
              <CmsEdit active={isEditMode} section="pricing_page" cmsKey={`faq${n}_q`} type="text">
                <p className="font-black text-neutral-100 md:text-lg">Q. {item.q}</p>
              </CmsEdit>
              <CmsEdit active={isEditMode} section="pricing_page" cmsKey={`faq${n}_a`} type="text">
                <p className="mt-4 text-sm font-medium leading-relaxed text-neutral-80 md:text-base">
                  A. {item.a}
                </p>
              </CmsEdit>
            </div>
            );
          })}
        </div>
      </section>
      </CmsEdit>

      <HomeConsultationCtaSection siteContent={siteContent} isEditMode={isEditMode} />
    </div>
  );
}
