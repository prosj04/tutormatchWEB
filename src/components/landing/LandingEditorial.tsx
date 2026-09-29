"use client";

import { useMemo } from "react";

import type { HallItem } from "@/components/common/HallOfFameCarousel";
import { HomeSafetyStory, type SafetyStoryData } from "@/components/landing/HomeSafetyStory";
import { useConsultationCta } from "@/hooks/useConsultationCta";
import type { LandingCmsContent } from "@/lib/cms";
import { parseCmsVisibility } from "@/lib/cms-page-defaults";
import { buildVisibleCompareRows } from "@/lib/compare-cms";
import { buildHallItem, HALL_DEFAULT_CARDS } from "@/lib/hall-items";

import { CareEditorial } from "./editorial/CareEditorial";
import { CompareEditorial } from "./editorial/CompareEditorial";
import { CtaEditorial } from "./editorial/CtaEditorial";
import { FaqEditorial } from "./editorial/FaqEditorial";
import { HeroEditorial } from "./editorial/HeroEditorial";
import { buildLandingCmsView } from "./editorial/landing-view";
import { PricingEditorial } from "./editorial/PricingEditorial";
import { ProcessEditorial } from "./editorial/ProcessEditorial";
import { ResultsEditorial } from "./editorial/ResultsEditorial";
import { TeachersEditorial } from "./editorial/TeachersEditorial";
import { useReveal } from "./editorial/useLandingInteractions";

/**
 * 홈 랜딩 v3 "Editorial" — LandingPageV2 를 대체하는 지면 구성.
 * 섹션·CMS 키·앵커 id·분석 이벤트(source)·CmsEdit 래퍼는 v2와 1:1로 대응한다.
 * 순서: 히어로 → 안전 스토리(+선언 01·02) → 프로세스 → 선생님 → 성과·후기
 *       → 학습관리 → 요금 → 비교 → FAQ → 최종 CTA
 */
export function LandingEditorial({
  cms,
  isEditMode = false,
}: {
  cms?: LandingCmsContent;
  isEditMode?: boolean;
}) {
  useReveal();
  const goConsultation = useConsultationCta();

  const view = useMemo(() => buildLandingCmsView(cms), [cms]);
  const { getCmsValue, getCmsMultiline, showFaq } = view;

  const compareRows = useMemo(
    () => buildVisibleCompareRows(cms?.siteContent),
    [cms?.siteContent],
  );

  const hallItems: HallItem[] = useMemo(
    () =>
      Array.from({ length: HALL_DEFAULT_CARDS.length }, (_, i) => i + 1)
        .filter((n) => parseCmsVisibility(getCmsValue("hall", `hall${n}_visible`, "1"), true))
        .map((n) => buildHallItem(n, (key, fallback) => getCmsValue("hall", key, fallback)))
        .filter((it) => it.title),
    [getCmsValue],
  );

  const safetyStory: SafetyStoryData = useMemo(() => {
    const S = "safety_story";
    const matchDefaults = [
      "활발한 아이에게는 — 끌려가지 않게 잡아주는 선생님",
      "여린 아이에게는 — 틀려도 기다려주는 선생님",
      "게으른 아이에게는 — 옆에서 본보기가 되는 선생님",
    ];
    // 스크롤텔링 피벗 다음 별도 화면에서 절차 01·02만 노출 (03~05는 Process 섹션으로 이관)
    const stepDefaults = [
      [
        "대표 직접 면접",
        "인품, 학력, 신원, 수업 실력.\n4가지 분야를 대표가 직접 전원 면접하고 교육하며, 엄격하게 검증된 선생님만 함께하고 있습니다.",
      ],
      [
        "매니저 직접 매칭",
        "학생의 공부 성향과 원하는 수업 방향을 상담을 통해 파악하고, 가장 적합한 선생님을 배정합니다.",
      ],
    ] as const;
    return {
      intro: getCmsMultiline(S, "intro", "과외는 많은 학생에게 최고의 해결책이지만.."),
      closer: getCmsMultiline(S, "closer", "아이가 다르면, 선생님도 달라야 합니다"),
      pivot: getCmsMultiline(S, "pivot", "우리는 직접 만나고,\n학생에게 맞춥니다"),
      matches: matchDefaults.map((m, i) => getCmsValue(S, `match${i + 1}`, m)),
      steps: stepDefaults.map(([title, desc], i) => ({
        title: getCmsValue(S, `step${i + 1}_title`, title),
        desc: getCmsMultiline(S, `step${i + 1}_desc`, desc),
      })),
    };
  }, [getCmsValue, getCmsMultiline]);

  const faqs = cms?.faqs ?? [];

  return (
    <div className="lx-root">
      <HeroEditorial view={view} isEditMode={isEditMode} />

      <HomeSafetyStory data={safetyStory} />

      <ProcessEditorial view={view} />

      <TeachersEditorial view={view} onMatch={(source) => void goConsultation(source)} />

      <ResultsEditorial view={view} hallItems={hallItems} isEditMode={isEditMode} />

      <CareEditorial view={view} />

      <PricingEditorial view={view} siteContent={cms?.siteContent} />

      {compareRows.length > 0 && (
        <CompareEditorial view={view} rows={compareRows} isEditMode={isEditMode} />
      )}

      {showFaq && faqs.length > 0 && <FaqEditorial view={view} faqs={faqs} />}

      <CtaEditorial view={view} />
    </div>
  );
}
