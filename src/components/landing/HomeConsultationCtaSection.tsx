"use client";

import { useMemo } from "react";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { buildCtaBenefitCards } from "@/lib/cta-benefits";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";

type HomeConsultationCtaSectionProps = {
  siteContent?: Record<string, Record<string, string>>;
};

/** 홈 하단 파란 상담 혜택 섹션 — CMS `cta` 섹션(홈 탭)과 연동 */
export function HomeConsultationCtaSection({ siteContent }: HomeConsultationCtaSectionProps) {
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "cta", key, fallback);

  const benefitCards = useMemo(() => buildCtaBenefitCards(siteContent), [siteContent]);

  return (
    <section
      id="consultation"
      className="scroll-mt-24 bg-primary py-28 md:min-h-[88vh] md:py-32 lg:py-36"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col justify-center px-5 md:min-h-[calc(88vh-10rem)]">
        <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-[-0.03em] text-white">
          {get("headline", "지금 신청하면 받을 수 있는 혜택이에요")}
        </h2>
        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/85">
          {get("subtext", "무료 상담 1회 · 매니저 직접 배정 · 학습 리포트 무료 제공")}
        </p>
        <div
          className={`mt-12 grid gap-5 sm:grid-cols-2 md:mt-14 md:gap-6 ${
            benefitCards.length > 4 ? "lg:grid-cols-3 xl:grid-cols-6" : "lg:grid-cols-4"
          }`}
        >
          {benefitCards.map((b) => (
            <div
              key={b.slot}
              className="flex min-h-[200px] flex-col rounded-[20px] border border-sky-200/40 bg-sky-200/25 p-7 backdrop-blur-sm md:min-h-[220px] md:p-8"
            >
              <p className="text-lg font-black text-white">{b.title}</p>
              <p className="mt-3 text-sm font-bold leading-snug text-white/90">{b.desc}</p>
              <p className="mt-4 flex-1 text-sm font-medium leading-relaxed text-white/75">
                {b.detail}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex justify-center md:mt-14">
          <ConsultationApplyButton className="inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-base font-black text-primary shadow-lg transition hover:bg-neutral-10">
            {get("button", "무료 상담 신청하기")}
          </ConsultationApplyButton>
        </div>
      </div>
    </section>
  );
}
