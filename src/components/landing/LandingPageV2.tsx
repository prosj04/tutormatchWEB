"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LandingCmsContent } from "@/lib/cms";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { HallOfFameCarousel, type HallItem } from "@/components/common/HallOfFameCarousel";
import { buildHallItem, HALL_DEFAULT_CARDS } from "@/lib/hall-items";
import { HomeSafetyStory, type SafetyStoryData } from "@/components/landing/HomeSafetyStory";
import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { PricingPlanCards } from "@/components/pricing/PricingPlanCards";
import { TutorProfileCard } from "@/components/tutors/TutorProfileCard";
import {
  formatCmsMultiline,
  getFeaturedTutorCards,
  parseCmsVisibility,
} from "@/lib/cms-page-defaults";
import { buildVisibleCompareRows } from "@/lib/compare-cms";
import { buildVisiblePricingPlanItems } from "@/lib/pricing-cms";
import { usePricingSchoolTier } from "@/lib/pricing-tier-preference";
import { useConsultationCta } from "@/hooks/useConsultationCta";

/* ─── static fallback data ─── */

const results: [string, string, string, string][] = [
  ["고2 학생", "수학 5등급", "2등급으로 상승", "3개월"],
  ["중3 학생", "영어 64점", "87점으로 상승", "4개월"],
  ["고1 학생", "국어 55점", "78점으로 상승", "3개월"],
  ["중2 학생", "수학 85점", "100점으로 상승", "2개월"],
  ["고3 학생", "영어 5등급", "3등급으로 상승", "5개월"],
  ["고1 학생", "수학 69점", "92점으로 상승", "3개월"],
];

const steps = [
  { number: "01", title: "무료 상담 신청", desc: "학생의 현재 성적, 목표, 성향을 간단히 남겨주세요. 30초면 매니저가 연락드립니다." },
  { number: "02", title: "매니저 학습 상담 및 선생님 배정", desc: "매니저가 직접 방문해 학습 상태를 진단하고, 상담에서 파악한 성향에 꼭 맞는 선생님을 배정합니다.\n학생이 수락하면 첫 수업 날짜를 확정하고 수업을 시작합니다." },
  { number: "03", title: "수업 관리 (숙제·질문)", desc: "선생님이 앱에서 숙제를 내면 학생이 매일매일 체크합니다.\n질문을 남기면 최고 성능의 질의응답 전용 AI가 즉시 답하고, 이어서 선생님 답변까지 받아볼 수 있습니다." },
  { number: "04", title: "리포트 & 학부모 앱", desc: "매 수업 후 수업 리포트, 매월 상세한 월간 리포트를 제공합니다.\n학부모 앱에서 수업·숙제·진도를 언제든 확인하실 수 있습니다." },
  { number: "05", title: "매니저 사후 관리", desc: "배정 이후에도 매니저가 상시 관리합니다.\n선생님이 맞지 않는다면 언제든 비용 없이 재매칭하고, 언제든 매니저 상담을 요청하실 수 있습니다." },
];

/** CMS pricing_title may be two lines; avoid repeating "1:1 맞춤 과외," in the highlight. */
function heroHeadlineWithHl(text: string) {
  const lines = formatCmsMultiline(text).split("\n");
  return lines.map((line, lineIndex) => (
    <span key={line}>
      {line.split(/(선생님)/).map((part, partIndex) =>
        part === "선생님" ? (
          <span key={partIndex} className="lp2-hl">
            {part}
          </span>
        ) : (
          part
        ),
      )}
      {lineIndex < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

function buildLandingCmsView(cms?: LandingCmsContent) {
  const getCmsValue = (section: string, key: string, fallback: string) =>
    cms?.siteContent[section]?.[key] ?? fallback;
  const getCmsMultiline = (section: string, key: string, fallback: string) =>
    formatCmsMultiline(getCmsValue(section, key, fallback));

  const cmsResults = results.flatMap(([student, before, after, months], index) => {
    const n = index + 1;
    const vis = getCmsValue("results", `result${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) return [];
    return [
      {
        student: getCmsValue("results", `result${n}_student`, student),
        before: getCmsValue("results", `result${n}_before`, before).replace(/→\s*$/, ""),
        after: getCmsValue("results", `result${n}_after`, after),
        months: getCmsValue("results", `result${n}_months`, months),
        image: getCmsValue(
          "results",
          `result${n}_image`,
          // 실제 시험지 사진 확보 전까지 이미지 슬롯 비움 (CMS로만 채움)
          "",
        ),
      },
    ];
  });
  const doubledResults = cmsResults.length > 0 ? [...cmsResults, ...cmsResults] : [];

  const cmsSteps = steps.flatMap((step, index) => {
    const n = index + 1;
    const vis = getCmsValue("features", `step${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, n <= 5)) return [];
    return [
      {
        ...step,
        title: getCmsValue("features", `step${n}_title`, step.title),
        desc: getCmsMultiline("features", `step${n}_desc`, step.desc),
      },
    ];
  });

  const managementItems = [1, 2, 3].flatMap((n) => {
    const vis = getCmsValue("management", `item${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) return [];
    const defaults: Record<number, { label: string; desc: string }> = {
      1: {
        label: "수업 리포트",
        desc: "매 수업이 끝날 때마다 진도, 피드백, 숙제, 다음 일정을 정리해 바로 보내드립니다.",
      },
      2: {
        label: "월간 상세 리포트",
        desc: "한 달의 성장과 변화, 취약 유형 분석을 누구보다 아이를 잘 아는 선생님이 직접 작성합니다.",
      },
      3: {
        label: "학부모 페이지",
        desc: "수업 진행, 선생님이 낸 숙제, 진도 현황을 언제 어디서든 확인하실 수 있습니다.",
      },
    };
    const d = defaults[n]!;
    return [
      {
        n,
        label: getCmsValue("management", `item${n}_title`, d.label),
        desc: getCmsMultiline("management", `item${n}_desc`, d.desc),
      },
    ];
  });

  const lessonCareItems = [1, 2].flatMap((n) => {
    const vis = getCmsValue("lesson_care", `item${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) return [];
    const defaults: Record<number, { label: string; desc: string }> = {
      1: {
        label: "숙제 관리",
        desc: "선생님이 숙제를 등록하면, 학생이 매일 체크합니다. 한 주 분량을 한 번에 내도 요일별로 나뉘어 관리됩니다.",
      },
      2: {
        label: "질문 관리",
        desc: "질문을 남기면 질의응답 전용 AI가 즉시 답하고, 이어서 선생님의 답변까지 받아볼 수 있습니다.",
      },
    };
    const d = defaults[n]!;
    return [
      {
        n,
        label: getCmsValue("lesson_care", `item${n}_title`, d.label),
        desc: getCmsMultiline("lesson_care", `item${n}_desc`, d.desc),
      },
    ];
  });

  const cmsTestimonials: Array<
    LandingCmsContent["testimonials"][number] & { title?: string }
  > =
    cms && cms.testimonials.length > 0
      ? cms.testimonials.slice(0, 3)
      : [
          {
            title: "시간만 보내던 아이가,\n계획을 세우는 아이로",
            quote:
              "공부하러 가서 시간만 보내던 아이가 처음으로 계획을 직접 잡고 실행했습니다. 아이에 맞는 선생님이란 게 이런 거구나 싶었습니다.",
            info: "고2 수학 · 학부모",
            img: "",
          },
          {
            title: "방황하던 아이 입에서\n선생님처럼 되고 싶다는 말이",
            quote:
              "방황하는 아들 방향 잡아줄 분이 필요했는데 정확히 맞는 분을 찾아줬어요. 요즘은 선생님처럼 되고 싶다면서 알아서 공부해요!",
            info: "고3 수학 · 학부모",
            img: "",
          },
          {
            title: "성적보다 먼저,\n습관이 바뀌었어요",
            quote:
              "숙제랑 계획을 등록하고 쌤이랑 같이 점검하니까 그냥 매일 하게 돼요. 성적보다 습관이 먼저 바뀐 게 더 신기해요.",
            info: "중3 영어 · 학생",
            img: "",
          },
        ];

  const kickers = {
    teachers: getCmsValue("home_labels", "kicker_teachers", "TEACHERS"),
    management: getCmsValue("home_labels", "kicker_management", "REPORTS"),
    lessonCare: getCmsValue("home_labels", "kicker_lesson_care", "LESSON CARE"),
    process: getCmsValue("home_labels", "kicker_process", "PROCESS"),
    plans: getCmsValue("home_labels", "kicker_plans", "PLANS"),
    reviews: getCmsValue("home_labels", "kicker_reviews", "REVIEWS"),
    results: getCmsValue("home_labels", "kicker_results", "RESULTS"),
    compare: getCmsValue("compare", "kicker", "COMPARE"),
    faq: getCmsValue("home_labels", "kicker_faq", "FAQ"),
  };

  const uiLabels = {
    faqTitle: getCmsValue("home_labels", "section_title_faq", "자주 묻는 질문"),
    viewAllTeachers: getCmsValue("home_labels", "cta_view_all_teachers", "선생님 전체 보기"),
    viewAllReviews: getCmsValue("home_labels", "cta_view_all_reviews", "후기 전체 보기 →"),
    viewAllPricing: getCmsValue("home_labels", "cta_view_all_pricing", "요금 자세히 보기 →"),
    viewAllFaq: getCmsValue("home_labels", "cta_view_all_faq", "FAQ 전체 보기 →"),
    featuredCardCta: getCmsValue("home_labels", "featured_card_cta", "빠른 매칭받기"),
    tierMiddle: getCmsValue("home_labels", "tier_middle", "중등"),
    tierHigh: getCmsValue("home_labels", "tier_high", "고등"),
    resultMonthsSuffix: getCmsValue("home_labels", "result_months_suffix", "수강"),
  };

  const sectionTitles = {
    problem: getCmsMultiline(
      "home_problem",
      "headline",
      "선생님을 잘못 만나면\n1~2달을 잃습니다",
    ),
    problemSubtext: getCmsValue(
      "home_problem",
      "subtext",
      "핏이 맞지 않는 수업은 성적보다 시간을 먼저 갉아먹습니다. Concord는 처음부터 학생에게 맞는 선생님을 찾는 데 집중합니다.",
    ),
    management: getCmsMultiline("management", "headline", "아이가 말해주지 않아도,\n알게 되실 겁니다"),
    lessonCare: getCmsMultiline("lesson_care", "headline", "수업이 없는 날에도,\n공부는 계속됩니다"),
    lessonCareSubtext: getCmsValue(
      "lesson_care",
      "subtext",
      "성적은 수업 사이의 매일이 만듭니다. 숙제와 질문을 시스템으로 관리합니다.",
    ),
    process: getCmsValue("features", "section_title", "이렇게 진행됩니다"),
    processSubtext: getCmsValue("features", "section_subtext", "상담과 배정부터 수업 관리, 사후 관리까지 전담 매니저가 처음부터 끝까지 책임집니다."),
    teachers: getCmsMultiline("tutors_featured", "home_title", "아무 선생님이나\n소개하지 않습니다"),
    teachersSubtext: getCmsValue(
      "tutors_featured",
      "home_subtext",
      "3단계 검증을 통과한 선생님만 소개합니다. 마음에 드는 선생님이 있다면 상담에서 말씀해 주세요. 매니저가 매칭 가능 여부를 확인해 드려요.",
    ),
    reviews: getCmsValue("home_labels", "section_title_reviews", "왜 학부모님들은 Concord를 선택했을까요?"),
    plans: getCmsMultiline("home_page", "plans_title", "가격까지 숨김없이 공개합니다"),
  };

  return {
    getCmsValue,
    getCmsMultiline,
    showFaq: parseCmsVisibility(getCmsValue("home_page", "show_faq_section", ""), true),
    showReviews: parseCmsVisibility(getCmsValue("home_page", "show_reviews_section", ""), true),
    cmsResults,
    doubledResults,
    cmsSteps,
    managementItems,
    lessonCareItems,
    cmsTestimonials,
    featuredTutors: getFeaturedTutorCards(cms?.siteContent)
      .filter((c) => c.home)
      .slice(0, 3),
    kickers,
    sectionTitles,
    uiLabels,
  };
}

/* ─── 목업 정렬·활성화 공용 훅 (process·reports·lesson-care 동일 구조) ─── */

/**
 * PC: 목업을 활성 항목 옆에 정렬 — 목업의 수직 "중앙"이 활성 항목의 수직 중앙과 일치하도록 보정.
 * (targetY = 항목중앙 − 목업높이/2, 목업 자신의 layout 기준선으로 자가 보정)
 * 섹션(리스트) 경계로 클램프해 목업이 리스트 범위를 벗어나지 않게 한다.
 */
function useAlignedMockY(
  listRef: React.RefObject<HTMLDivElement | null>,
  mockRef: React.RefObject<HTMLDivElement | null>,
  active: number,
) {
  const [y, setY] = useState(0);
  useEffect(() => {
    const list = listRef.current;
    const mock = mockRef.current;
    if (!list || !mock) return;
    const item = list.children[active] as HTMLElement | undefined;
    if (!item) return;
    // transform(등장 애니메이션 등)과 무관한 layout 좌표로 계산 — 전환 중에도 항상 정확
    const layoutTop = (el: HTMLElement) => {
      let t = 0;
      let n: HTMLElement | null = el;
      while (n) {
        t += n.offsetTop;
        n = n.offsetParent as HTMLElement | null;
      }
      return t;
    };
    const mockTop = layoutTop(mock);
    const mockH = mock.offsetHeight;
    const itemCenter = layoutTop(item) + item.offsetHeight / 2;
    // 목업 수직 "중앙"을 항목 수직 중앙에 맞춤
    let target = itemCenter - mockH / 2 - mockTop;
    // 섹션 경계 클램프: 목업이 섹션(가장 가까운 <section>) 밖으로 나가지 않도록.
    // 리스트만 기준으로 잡으면 목업이 리스트보다 클 때 마지막 항목 중앙에 맞출 여유가 없어지므로,
    // 섹션 상·하 여백까지 포함한 섹션 콘텐츠 박스를 기준으로 삼아 중앙 정렬 여유를 확보한다.
    const section = (mock.closest("section") as HTMLElement | null) ?? mock.parentElement ?? list;
    const boundsTop = layoutTop(section);
    const minY = boundsTop - mockTop; // 목업 상단이 섹션 상단
    const maxY = boundsTop + section.offsetHeight - mockH - mockTop; // 목업 하단이 섹션 하단
    if (maxY > minY) target = Math.min(Math.max(target, minY), maxY);
    setY(target);
  }, [active, listRef, mockRef]);
  return y;
}

/** 탭 우선 잠금: 최근 탭 이후 이 시간(ms)동안 중앙 자동 활성화를 억제 */
const TAP_LOCK_MS = 1600;

/**
 * 모바일/태블릿: 스크롤 시 화면 중앙에 가장 가까운 항목을 자동 활성화.
 * hover가 없는 터치 기기에서는 사용자의 탭 선택이 곧바로 스크롤에 덮이지 않도록,
 * manualLockRef(최근 탭 시각)가 유효한 동안 중앙 감지를 건너뛴다(탭 우선).
 */
function useMobileCenterActive(
  listRef: React.RefObject<HTMLDivElement | null>,
  setActive: React.Dispatch<React.SetStateAction<number>>,
  manualLockRef?: React.MutableRefObject<number>,
) {
  useEffect(() => {
    if (!window.matchMedia("(max-width: 960px)").matches) return;
    const list = listRef.current;
    if (!list) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        // 최근 탭이 있었다면 그 선택을 유지(탭 우선)
        if (manualLockRef && Date.now() - manualLockRef.current < TAP_LOCK_MS) return;
        const mid = window.innerHeight / 2;
        let best = -1;
        let bestDist = Infinity;
        Array.from(list.children).forEach((el, i) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          const d = Math.abs(r.top + r.height / 2 - mid);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        if (best >= 0) setActive((prev) => (prev === best ? prev : best));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [listRef, setActive, manualLockRef]);
}

/**
 * 목업 리스트 히트박스 좌우 확장: 컨테이너 위 세로 위치(clientY)로 어느 자식 행에 있는지 계산해 활성화.
 * 가로 위치와 무관하게 같은 높이(행)면 인식된다. hover 가능한 기기에서만 동작(터치 탭 우선 보존).
 * manualLockRef(최근 탭 시각)가 유효한 동안은 건너뛴다.
 */
function makeRowHoverMove(
  setActive: React.Dispatch<React.SetStateAction<number>>,
  manualLockRef?: React.MutableRefObject<number>,
) {
  return (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) return;
    if (manualLockRef && Date.now() - manualLockRef.current < TAP_LOCK_MS) return;
    const list = e.currentTarget;
    const y = e.clientY;
    const rows = list.children;
    for (let i = 0; i < rows.length; i++) {
      const r = (rows[i] as HTMLElement).getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) {
        setActive((prev) => (prev === i ? prev : i));
        return;
      }
    }
  };
}

/* ─── scroll-reveal hook ─── */
function useReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
    };
  }, []);
}

/* ─── main component ─── */
export function LandingPageV2({
  cms,
  isEditMode = false,
}: {
  cms?: LandingCmsContent;
  isEditMode?: boolean;
}) {
  useReveal();
  const goConsultation = useConsultationCta();
  const [tier, setTier] = usePricingSchoolTier();
  const [activeStep, setActiveStep] = useState(0); // 우측 목업 (호버) + 아코디언
  const procListRef = useRef<HTMLDivElement | null>(null);
  const procMockRef = useRef<HTMLDivElement | null>(null);
  const procTapLockRef = useRef(0); // 터치 기기 탭 우선 잠금(중앙 감지 억제)
  // 데스크톱 목업은 reports와 동일 방식: 활성 스텝 항목 옆에 목업 수직 중앙 정렬(스크롤 추적 없음)
  const procMockY = useAlignedMockY(procListRef, procMockRef, activeStep);
  useMobileCenterActive(procListRef, setActiveStep, procTapLockRef);

  // 리포트·수업 관리 섹션 — 프로세스와 동일 구조 (호버 정렬 + 모바일 중앙 활성화)
  const [activeCare, setActiveCare] = useState(0);
  const careListRef = useRef<HTMLDivElement | null>(null);
  const careMockRef = useRef<HTMLDivElement | null>(null);
  const careMockY = useAlignedMockY(careListRef, careMockRef, activeCare);
  useMobileCenterActive(careListRef, setActiveCare);

  const [activeLessonCare, setActiveLessonCare] = useState(0);
  const lessonCareListRef = useRef<HTMLDivElement | null>(null);
  const lessonCareMockRef = useRef<HTMLDivElement | null>(null);
  const lessonCareMockY = useAlignedMockY(lessonCareListRef, lessonCareMockRef, activeLessonCare);
  useMobileCenterActive(lessonCareListRef, setActiveLessonCare);

  // hover 없는 터치 기기: 스텝 탭이 곧바로 중앙 감지에 덮이지 않도록 탭을 우선시
  const activateStepByTap = (index: number) => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
      procTapLockRef.current = Date.now();
    }
    setActiveStep(index);
  };

  const {
    getCmsValue,
    getCmsMultiline,
    showFaq,
    showReviews,
    cmsResults,
    doubledResults,
    cmsSteps,
    managementItems,
    lessonCareItems,
    cmsTestimonials,
    featuredTutors,
    kickers,
    sectionTitles,
    uiLabels,
  } = useMemo(() => buildLandingCmsView(cms), [cms]);

  const compareRowsCms = useMemo(
    () => buildVisibleCompareRows(cms?.siteContent),
    [cms?.siteContent],
  );

  const homePricingDuo = useMemo(() => {
    const all = buildVisiblePricingPlanItems(cms?.siteContent, tier);
    const rec = all.find((i) => i.plan.weekly === 2 && i.plan.hoursPerLesson === 2);
    if (!rec) return all.slice(0, 2);
    const other = all.find((i) => i !== rec);
    return other ? [other, rec] : [rec];
  }, [cms?.siteContent, tier]);

  const hallItems: HallItem[] = useMemo(() => {
    return Array.from({ length: HALL_DEFAULT_CARDS.length }, (_, i) => i + 1)
      .filter((n) => parseCmsVisibility(getCmsValue("hall", `hall${n}_visible`, "1"), true))
      .map((n) => buildHallItem(n, (key, fallback) => getCmsValue("hall", key, fallback)))
      .filter((it) => it.title);
  }, [getCmsValue]);

  const safetyStory: SafetyStoryData = useMemo(() => {
    const S = "safety_story";
    const matchDefaults = [
      "활발한 아이에게는 — 끌려가지 않게 잡아주는 선생님",
      "여린 아이에게는 — 틀려도 기다려주는 선생님",
      "게으른 아이에게는 — 옆에서 본보기가 되는 선생님",
    ];
    // 스크롤텔링 피벗 다음 별도 화면에서 절차 01·02만 노출 (03~05는 Process 섹션으로 이관)
    const stepDefaults = [
      ["대표 직접 면접", "인품, 학력, 신원, 수업 실력.\n4가지 분야를 대표가 직접 전원 면접하고 교육하며, 엄격하게 검증된 선생님만 함께하고 있습니다."],
      ["매니저 직접 매칭", "학생의 공부 성향과 원하는 수업 방향을 상담을 통해 파악하고, 가장 적합한 선생님을 배정합니다."],
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

  /* 프로세스 단계별 목업 — 데스크톱은 우측 추적 칼럼, 모바일은 열린 아코디언 아래 인라인 */
  const procMocks = [
    <>
      <div className="lp2-notif-card">
        <div className="lp2-notif-head">
          <span className="lp2-proof-dot" />
          상담 신청 접수
          <span className="t">오늘 14:02</span>
        </div>
        <p>담당 매니저가 24시간 안에 연락드립니다.</p>
      </div>
      <div className="lp2-proc-mock-note">이름 없이 연락처와 학년만으로 시작됩니다</div>
    </>,
    <>
      <div className="lp2-notif-card">
        <div className="lp2-notif-head">
          <span className="lp2-proof-dot" />
          선생님 배정 완료
          <span className="t">방문 상담 후</span>
        </div>
        <div className="lp2-notif-rows">
          <div><span className="k">진단</span><span className="v">조용·신중형 · 내신 수학 2등급 목표</span></div>
          <div><span className="k">선생님</span><span className="v">김서연 · 서울대 수리과학부 · 기다려주는 수업</span></div>
          <div><span className="k">첫 수업</span><span className="v">목요일 19:00 · 자택 방문</span></div>
        </div>
        <div className="lp2-match-accept">
          <button type="button" className="lp2-accept-btn" tabIndex={-1}>이 선생님으로 수락하기</button>
          <span className="lp2-accept-note">수락해야 수업이 시작됩니다</span>
        </div>
      </div>
      <div className="lp2-proc-mock-note">방문 진단으로 성향까지 맞춘 선생님을 배정합니다</div>
    </>,
    <>
      <div className="lp2-report-card lp2-mock-hw">
        <div className="lp2-report-head">
          <span className="lp2-proof-dot" />
          <strong>오늘의 숙제</strong>
          <span className="t">매일 체크</span>
        </div>
        <div className="lp2-hw-list">
          <div className="lp2-hw-row done">
            <span className="c">✓</span>
            <span className="v">유형 연습 4문항</span>
          </div>
          <div className="lp2-hw-row done">
            <span className="c">✓</span>
            <span className="v">오답노트 정리 2개</span>
          </div>
          <div className="lp2-hw-row todo">
            <span className="c" />
            <span className="v">개념 복습 p.84~87</span>
          </div>
        </div>
      </div>
      <div className="lp2-qna-card lp2-mock-qna">
        <div className="lp2-qna-body">
          <div className="lp2-qmsg q">
            <span className="who">학생</span>
            <p>12번, 판별식으로 풀었는데 답이 왜 다르죠?</p>
          </div>
          <div className="lp2-qmsg a">
            <span className="chip ai">AI 즉시 답변</span>
            <p>범위 조건 x&gt;0이 빠졌어요. 반영하면 근이 하나로 정해집니다.</p>
          </div>
          <div className="lp2-qmsg a">
            <span className="chip tc">선생님 답변</span>
            <p>맞아요. 자주 놓치는 유형이라 다음 수업에 한 번 더 봐요.</p>
          </div>
        </div>
      </div>
      <div className="lp2-proc-mock-note">매일 체크하는 숙제 + AI·선생님 2단 답변</div>
    </>,
    <>
      <div className="lp2-report-card lp2-mock-parent">
        <div className="lp2-report-head">
          <span className="lp2-proof-dot" />
          <strong>Concord 학부모 앱</strong>
          <span className="t">실시간</span>
        </div>
        <div className="lp2-parent-gauge">
          <div className="lp2-gauge-top">
            <span className="lbl">이번 주 진도</span>
            <span className="pct">82%</span>
          </div>
          <div className="lp2-gauge-bar"><span style={{ width: "82%" }} /></div>
        </div>
        <div className="lp2-parent-list">
          <div className="lp2-parent-row">
            <span className="ic">📄</span>
            <span className="v">수업 리포트 · 3/15</span>
          </div>
          <div className="lp2-parent-row">
            <span className="ic">✅</span>
            <span className="v">숙제 완료 5/6</span>
          </div>
        </div>
        <button type="button" className="lp2-parent-btn" tabIndex={-1}>월간 리포트 보기 →</button>
      </div>
      <div className="lp2-proc-mock-note">수업·월간 리포트를 학부모 앱에서 언제든 확인</div>
    </>,
    <>
      <div className="lp2-notif-card">
        <div className="lp2-notif-head">
          <span className="lp2-proof-dot" />
          매니저 사후 관리
          <span className="t">배정 이후 상시</span>
        </div>
        <div className="lp2-notif-rows">
          <div><span className="k">관리</span><span className="v">매니저 상시 점검 · 언제든 상담 요청</span></div>
          <div><span className="k">재매칭</span><span className="v">맞지 않으면 비용 0원 교체</span></div>
        </div>
      </div>
      <div className="lp2-proc-mock-note">배정 이후에도 매니저가 끝까지 함께합니다</div>
    </>,
  ];

  /* 리포트 목업 — 데스크톱은 우측 칼럼, 모바일은 해당 번호 아래 인라인 */
  const lessonReportMock = (
    <div className="lp2-report-card">
      <div className="lp2-report-head">
        <span className="lp2-proof-dot" />
        <strong>수업 리포트</strong>
        <span className="t">매 수업 직후</span>
      </div>
      <div className="lp2-report-body">
        <div className="lp2-report-row">
          <span className="k">진도</span>
          <span className="v">이차함수 그래프 활용 (교재 p.84~91)</span>
        </div>
        <div className="lp2-report-row">
          <span className="k">숙제</span>
          <span className="v">유형 연습 12문항 · 요일별 배분</span>
        </div>
        <div className="lp2-report-row">
          <span className="k">다음 수업</span>
          <span className="v">목요일 19:00 방문</span>
        </div>
      </div>
      <div className="lp2-report-foot">수업이 끝날 때마다 바로 보내드립니다</div>
    </div>
  );
  const monthlyReportMock = (
    <div className="lp2-report-card">
      <div className="lp2-report-head">
        <span className="lp2-proof-dot" />
        <strong>월간 상세 리포트</strong>
        <span className="t">6월 리포트</span>
      </div>
      <div className="lp2-report-body">
        <div className="lp2-report-row">
          <span className="k">이달 진도</span>
          <span className="v">이차함수 그래프 활용 (교재 p.84~91)</span>
        </div>
        <div className="lp2-report-row">
          <span className="k">취약 유형</span>
          <span className="v">범위 조건 누락 · 계산 실수</span>
        </div>
        <div className="lp2-report-row">
          <span className="k">선생님 코멘트</span>
          <span className="v">
            응용 문제에 접근하는 방식이 눈에 띄게 좋아졌습니다. 다음 달은
            실수 유형을 함께 줄여보겠습니다.
          </span>
        </div>
      </div>
      <div className="lp2-report-foot">매월 선생님이 직접 작성해 학부모님께 전달됩니다</div>
    </div>
  );
  const parentAppMock = (
    <div className="lp2-report-card">
      <div className="lp2-report-head">
        <span className="lp2-proof-dot" />
        <strong>Concord 학부모 페이지</strong>
        <span className="t">실시간</span>
      </div>
      <div className="lp2-report-body">
        <div className="lp2-report-row">
          <span className="k">이번 주 수업</span>
          <span className="v">화 완료 · 목 예정</span>
        </div>
        <div className="lp2-report-row">
          <span className="k">숙제 진행</span>
          <span className="v">12문항 중 8문항 완료</span>
        </div>
        <div className="lp2-report-row">
          <span className="k">진도</span>
          <span className="v">이차함수 그래프 활용</span>
        </div>
      </div>
      <div className="lp2-report-foot">수업·숙제·진도를 한 화면에서 바로 확인하실 수 있습니다</div>
    </div>
  );

  /* 수업 관리 목업 — 숙제 매일 체크 + AI 질의응답 */
  const homeworkMock = (
    <div className="lp2-report-card">
      <div className="lp2-report-head">
        <span className="lp2-proof-dot" />
        <strong>이번 주 숙제</strong>
        <span className="t">선생님이 등록</span>
      </div>
      <div className="lp2-hw-list">
        <div className="lp2-hw-row done">
          <span className="d">월</span>
          <span className="v">유형 연습 4문항</span>
          <span className="c">✓</span>
        </div>
        <div className="lp2-hw-row done">
          <span className="d">화</span>
          <span className="v">오답노트 2개</span>
          <span className="c">✓</span>
        </div>
        <div className="lp2-hw-row today">
          <span className="d">수</span>
          <span className="v">유형 연습 4문항</span>
          <span className="c">오늘</span>
        </div>
        <div className="lp2-hw-row">
          <span className="d">목</span>
          <span className="v">수업 전 복습</span>
          <span className="c" />
        </div>
      </div>
      <div className="lp2-report-foot">학생이 매일 체크하고, 선생님이 확인합니다</div>
    </div>
  );
  const careQnaMock = (
    <div className="lp2-qna-card">
      <div className="lp2-report-head">
        <span className="lp2-proof-dot" />
        <strong>질문·답변</strong>
        <span className="t">수업 없는 날에도</span>
      </div>
      <div className="lp2-qna-body">
        <div className="lp2-bubble student">
          <span className="who">학생 · 밤 11:24</span>
          <p>쌤, 오늘 숙제 12번이요… 판별식으로 풀었는데 답이 왜 다르죠?</p>
        </div>
        <div className="lp2-bubble ai">
          <span className="who">AI 답변 · 밤 11:24 · 즉시</span>
          <p>범위 조건 x&gt;0이 빠졌어요. 조건을 반영하면 근이 하나로 정해집니다. 풀이 단계를 정리해 드릴게요.</p>
        </div>
        <div className="lp2-bubble teacher">
          <span className="who">선생님 · 아침 7:40</span>
          <p>AI 풀이 그대로예요. 범위 조건은 자주 놓치는 유형이라 다음 수업 때 한 번 더 봐요.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lp2-root">
      {/* ══ 1. HERO ═══════════════════════════════════════ */}
      <section className="lp2-hero">
        <div className="lp2-hero-bg" />
        <div className="lp2-wrap lp2-hero-inner reveal">
          <div className="lp2-hero-cols">
            <div className="lp2-hero-main">
              <span className="lp2-eyebrow">Concord Private Tutoring</span>
              <h1 style={{ whiteSpace: "pre-line" }}>
                <CmsEdit active={isEditMode} section="hero" cmsKey="headline" type="text">
                  {heroHeadlineWithHl(
                    getCmsValue("hero", "headline", "학생마다 맞는\n선생님이 다릅니다"),
                  )}
                </CmsEdit>
              </h1>
              <p className="lp2-lede">
                <CmsEdit active={isEditMode} section="hero" cmsKey="subtext" type="text">
                  {getCmsMultiline(
                    "hero",
                    "subtext",
                    "2학기를 뒤집는 여름방학, 잘 맞는 선생님에서 시작됩니다.",
                  )}
                </CmsEdit>
              </p>
              <div className="lp2-cta-row">
                <ConsultationApplyButton className="lp2-btn lp2-btn-acc" source="home_hero">
                  <CmsEdit active={isEditMode} section="hero" cmsKey="cta_primary" type="text">
                    {getCmsValue("hero", "cta_primary", "선생님 추천받기")}
                  </CmsEdit>
                </ConsultationApplyButton>
                <a href="#teachers" className="lp2-btn lp2-btn-ghost">
                  <CmsEdit active={isEditMode} section="hero" cmsKey="cta_secondary" type="text">
                    {getCmsValue("hero", "cta_secondary", "선생님 둘러보기 →")}
                  </CmsEdit>
                </a>
              </div>
              <p className="lp2-hero-note">
                <CmsEdit active={isEditMode} section="hero" cmsKey="region_note" type="text">
                  {getCmsValue("hero", "region_note", "서울 · 동탄 방문 수업")}
                </CmsEdit>
              </p>
            </div>

            <div className="lp2-hero-visual" aria-hidden="true">
              <div className="lp2-hero-model">
                <CmsEdit active={isEditMode} section="hero" cmsKey="model_image" type="image">
                  <Image
                    src={getCmsValue("hero", "model_image", "/images/placeholders/hero-thumbnail.png")}
                    alt=""
                    fill
                    sizes="(max-width:960px) 84vw, 400px"
                    className="object-cover"
                    priority
                  />
                </CmsEdit>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 3. SAFETY STORY (스크롤텔링: 밝음 → 뉴스 다크 → 절차 밝음) ══ */}
      <HomeSafetyStory data={safetyStory} />

      {/* ══ 4. PROCESS (Concord 방식 5단계) ════════════════ */}
      <section id="process" className="lp2-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">{kickers.process}</span>
            <h2>{sectionTitles.process}</h2>
            <p>{sectionTitles.processSubtext}</p>
          </div>

          <div className="lp2-proc-cols">
            <div
              className="lp2-proc-list"
              ref={procListRef}
              onMouseMove={makeRowHoverMove(setActiveStep, procTapLockRef)}
            >
              {cmsSteps.map((step, index) => (
                <details
                  key={step.number}
                  className="lp2-proc-item reveal"
                  open={index === activeStep}
                  onMouseEnter={() => setActiveStep(index)}
                >
                  <summary
                    onClick={(e) => {
                      e.preventDefault();
                      activateStepByTap(index); // 터치 기기: 탭으로 열고 중앙 감지보다 우선
                    }}
                    onFocus={() => setActiveStep(index)}
                  >
                    <span className="lp2-proc-n">{step.number}</span>
                    <span className="lp2-proc-t">{step.title}</span>
                    <span className="lp2-faq-ind" aria-hidden="true">+</span>
                  </summary>
                  <p className="lp2-proc-p" style={{ whiteSpace: "pre-line" }}>{step.desc}</p>
                </details>
              ))}
            </div>

            {/* 모바일: 화면 중앙 번호의 목업이 뷰포트 하단에 고정 (섹션 밖으로 나가지 않음) */}
            <div className="lp2-proc-mobile-mock lp2-mobile-only" aria-hidden="true">
              <div className="lp2-proc-mock-view" key={`m-${activeStep}`}>
                {procMocks[activeStep]}
              </div>
            </div>

            {/* reports 방식: 활성 스텝 옆에 목업 중앙 정렬, 이동은 부드럽게·콘텐츠는 크로스페이드 */}
            <div
              className="lp2-proc-mock lp2-desktop-only"
              aria-hidden="true"
              ref={procMockRef}
              style={{
                transform: `translateY(${procMockY}px)`,
                transition: "transform .45s cubic-bezier(.22,1,.36,1)",
              }}
            >
              <div className="lp2-proc-mock-view" key={activeStep}>
                {procMocks[activeStep]}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 5. FEATURED TEACHERS ══════════════════════════ */}
      <section id="teachers" className="lp2-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">{kickers.teachers}</span>
            <h2 style={{ whiteSpace: "pre-line" }}>{sectionTitles.teachers}</h2>
            <p>{sectionTitles.teachersSubtext}</p>
          </div>

          <div className="lp2-tpx-grid reveal">
            {featuredTutors.map((card) => (
              <TutorProfileCard
                key={card.index}
                card={card}
                ctaLabel={uiLabels.featuredCardCta}
                onMatch={(i) => void goConsultation(`home_featured_${i}`)}
                isCenter
              />
            ))}
          </div>

          <div className="lp2-cta-row" style={{ marginTop: 40, justifyContent: "center" }}>
            <Link href="/tutors" className="lp2-btn lp2-btn-ghost">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {uiLabels.viewAllTeachers}
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 6. RESULTS + REVIEWS ══════════════════════════ */}
      <section id="results" className="lp2-sec lp2-rev-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">{kickers.results}</span>
            <h2>
              <CmsEdit active={isEditMode} section="results" cmsKey="section_title" type="text">
                {getCmsValue("results", "section_title", "결과로 증명합니다")}
              </CmsEdit>
            </h2>
            <p className="lp2-result-note">
              <CmsEdit active={isEditMode} section="results" cmsKey="section_note" type="text">
                {getCmsValue("results", "section_note", "2026년 상반기 Concord 수강생 기준")}
              </CmsEdit>
            </p>
          </div>
        </div>

        {doubledResults.length > 0 && (
          <div className="lp2-result-marquee">
            <div className="lp2-result-track">
              {doubledResults.map((item, i) => {
                const n = (i % cmsResults.length) + 1;
                const isOriginal = i < cmsResults.length;
                return (
                  <article key={i} className="lp2-result-card">
                    {item.image ? (
                      <div className="lp2-result-img">
                        {isOriginal ? (
                          <CmsEdit active={isEditMode} section="results" cmsKey={`result${n}_image`} type="image">
                            <Image
                              src={item.image}
                              alt={`${item.student} 성적 변화`}
                              fill
                              sizes="220px"
                              className="object-cover"
                            />
                          </CmsEdit>
                        ) : (
                          <Image
                            src={item.image}
                            alt={`${item.student} 성적 변화`}
                            fill
                            sizes="220px"
                            className="object-cover"
                          />
                        )}
                      </div>
                    ) : null}
                    <div className="lp2-result-body">
                      <div className="lp2-result-meta">
                        <span className="lp2-result-badge">
                          {isOriginal ? (
                            <CmsEdit active={isEditMode} section="results" cmsKey={`result${n}_student`} type="text">
                              {item.student}
                            </CmsEdit>
                          ) : item.student}
                        </span>
                        <span className="lp2-result-months">
                          {isOriginal ? (
                            <CmsEdit active={isEditMode} section="results" cmsKey={`result${n}_months`} type="text">
                              {item.months} {uiLabels.resultMonthsSuffix}
                            </CmsEdit>
                          ) : `${item.months} ${uiLabels.resultMonthsSuffix}`}
                        </span>
                      </div>
                      <p className="lp2-result-text">
                        {isOriginal ? (
                          <CmsEdit active={isEditMode} section="results" cmsKey={`result${n}_before`} type="text">
                            <span className="before">{item.before}</span>
                          </CmsEdit>
                        ) : <span className="before">{item.before}</span>}
                        <span className="arr">→</span>
                        {isOriginal ? (
                          <CmsEdit active={isEditMode} section="results" cmsKey={`result${n}_after`} type="text">
                            <span className="after">{item.after}</span>
                          </CmsEdit>
                        ) : <span className="after">{item.after}</span>}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {showReviews && (
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal" style={{ marginTop: 56 }}>
            <span className="lp2-eyebrow">{kickers.reviews}</span>
            <h2>{sectionTitles.reviews}</h2>
          </div>

          <div className="reveal" style={{ marginBottom: 40 }}>
            <HallOfFameCarousel items={hallItems} />
          </div>

          <div className="lp2-rev-scroll reveal" role="list">
            {cmsTestimonials.map((t, i) => (
              <div key={i} className="lp2-rev-card" role="listitem">
                <div className="lp2-rev-head">
                  <div className="lp2-rev-avatar">
                    {t.img ? (
                      <Image src={t.img} alt={`${t.info} 사진`} fill sizes="72px" className="object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="8.2" r="3.6" fill="currentColor" />
                        <path d="M4.5 20.2c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <div className="lp2-rev-headtxt">
                    {t.title ? (
                      <h3 className="lp2-rev-title" style={{ whiteSpace: "pre-line" }}>
                        &ldquo;{t.title}&rdquo;
                      </h3>
                    ) : null}
                    <div className="by">{t.info}</div>
                    {t.gradeFrom && t.gradeTo ? (
                      <div
                        className="lp2-rev-grade"
                        aria-label={`${t.gradeFrom}에서 ${t.gradeTo}로 향상`}
                      >
                        <span className="from">{t.gradeFrom}</span>
                        <span className="arrow" aria-hidden="true">→</span>
                        <span className="to">{t.gradeTo}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <p className="qt">{t.quote}</p>
              </div>
            ))}
          </div>
          {cmsTestimonials.some((t) => t.img) ? (
            <p className="lp2-rev-imgnote">*사진은 실제 후기 작성자와 다를 수 있습니다</p>
          ) : null}

          <div className="lp2-cta-row" style={{ marginTop: 40 }}>
            <Link href="/reviews" className="lp2-btn lp2-btn-ghost lp2-btn-sm">
              {uiLabels.viewAllReviews}
            </Link>
          </div>
        </div>
        )}
      </section>

      {/* ══ 7. REPORTS (수업·월간 리포트 + 학부모 페이지) ══ */}
      <section id="management" className="lp2-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-care-cols">
            <div className="lp2-care-left">
              <div className="lp2-sec-head reveal">
                <span className="lp2-eyebrow">{kickers.management}</span>
                <h2 style={{ whiteSpace: "pre-line" }}>{sectionTitles.management}</h2>
                <p>
                  {getCmsValue(
                    "management",
                    "subtext",
                    "모든 수업은 기록으로 남습니다. 수업 리포트, 월간 리포트, 학부모 페이지로 아이의 공부를 그대로 보실 수 있습니다.",
                  )}
                </p>
              </div>

              <div
                className="lp2-care-list"
                ref={careListRef}
                onMouseMove={makeRowHoverMove(setActiveCare)}
              >
                {managementItems.map((item, index) => (
                  <div
                    key={item.n}
                    className="lp2-care-row reveal"
                    onMouseEnter={() => setActiveCare(index)}
                  >
                    <div className="num">0{item.n}</div>
                    <div>
                      <h3>{item.label}</h3>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 모바일: 화면 중앙 항목의 목업이 뷰포트 하단에 고정 */}
            <div className="lp2-care-mobile-mock lp2-mobile-only" aria-hidden="true">
              <div key={`m-care-${activeCare}`}>
                {[lessonReportMock, monthlyReportMock, parentAppMock][
                  (managementItems[activeCare]?.n ?? 1) - 1
                ]}
              </div>
            </div>

            <div
              className="lp2-care-mock reveal lp2-desktop-only"
              aria-hidden="true"
              ref={careMockRef}
              style={{
                transform: `translateY(${careMockY}px)`,
                transition:
                  "transform .45s cubic-bezier(.22,1,.36,1), opacity 2s cubic-bezier(.45,.05,.25,1)",
              }}
            >
              <div key={`care-${activeCare}`}>
                {[lessonReportMock, monthlyReportMock, parentAppMock][
                  (managementItems[activeCare]?.n ?? 1) - 1
                ]}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 7.2 LESSON CARE (숙제·질문 관리) ═══════════════ */}
      <section id="lesson-care" className="lp2-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-care-cols">
            <div className="lp2-care-left">
              <div className="lp2-sec-head reveal">
                <span className="lp2-eyebrow">{kickers.lessonCare}</span>
                <h2 style={{ whiteSpace: "pre-line" }}>{sectionTitles.lessonCare}</h2>
                <p>{sectionTitles.lessonCareSubtext}</p>
              </div>

              <div
                className="lp2-care-list"
                ref={lessonCareListRef}
                onMouseMove={makeRowHoverMove(setActiveLessonCare)}
              >
                {lessonCareItems.map((item, index) => (
                  <div
                    key={item.n}
                    className="lp2-care-row reveal"
                    onMouseEnter={() => setActiveLessonCare(index)}
                  >
                    <div className="num">0{item.n}</div>
                    <div>
                      <h3>{item.label}</h3>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 모바일: 화면 중앙 항목의 목업이 뷰포트 하단에 고정 */}
            <div className="lp2-care-mobile-mock lp2-mobile-only" aria-hidden="true">
              <div key={`m-lc-${activeLessonCare}`}>
                {[homeworkMock, careQnaMock][(lessonCareItems[activeLessonCare]?.n ?? 1) - 1]}
              </div>
            </div>

            <div
              className="lp2-care-mock reveal lp2-desktop-only"
              aria-hidden="true"
              ref={lessonCareMockRef}
              style={{
                transform: `translateY(${lessonCareMockY}px)`,
                transition:
                  "transform .45s cubic-bezier(.22,1,.36,1), opacity 2s cubic-bezier(.45,.05,.25,1)",
              }}
            >
              <div key={`lc-${activeLessonCare}`}>
                {[homeworkMock, careQnaMock][(lessonCareItems[activeLessonCare]?.n ?? 1) - 1]}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 8. PRICING ════════════════════════════════════ */}
      <section id="pricing" className="lp2-sec lp2-price-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-price-cols reveal">
            <div className="lp2-price-left">
              <span className="lp2-eyebrow">{kickers.plans}</span>
              <h2 style={{ whiteSpace: "pre-line" }}>{sectionTitles.plans}</h2>
              <div className="lp2-price-guar">
                <p>
                  <span className="lp2-ok" aria-hidden="true">✓</span>
                  {getCmsValue("guarantee", "item1", "첫 수업이 맞지 않으면 100% 환불")}
                </p>
                <p>
                  <span className="lp2-ok" aria-hidden="true">✓</span>
                  {getCmsValue("guarantee", "item2", "선생님 교체 비용 0원")}
                </p>
                <Link href="/refund" className="lp2-guar-note">
                  *환불정책 참고
                </Link>
              </div>
              <Link href="/pricing" className="lp2-btn lp2-btn-ghost lp2-btn-sm" style={{ marginTop: 28 }}>
                {uiLabels.viewAllPricing}
              </Link>
            </div>

            <div className="lp2-price-right">
              <div className="tier-tabs" role="group" aria-label="학년 선택" style={{ marginBottom: 20 }}>
                <button
                  type="button"
                  className={tier === "middle" ? "on" : undefined}
                  onClick={() => setTier("middle")}
                >
                  중등
                </button>
                <button
                  type="button"
                  className={tier === "high" ? "on" : undefined}
                  onClick={() => setTier("high")}
                >
                  고등
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

      {/* ══ 8.5 COMPARE (서비스 비교) ══════════════════════ */}
      {compareRowsCms.length > 0 && (
        <section id="compare" className="lp2-sec" style={{ scrollMarginTop: "80px" }}>
          <div className="lp2-wrap">
            <div className="lp2-sec-head reveal">
              <span className="lp2-eyebrow">{kickers.compare}</span>
              <h2>
                <CmsEdit active={isEditMode} section="compare" cmsKey="table_title" type="text">
                  {getCmsValue("compare", "table_title", "개인 과외와 이렇게 다릅니다")}
                </CmsEdit>
              </h2>
              <p>맞지 않는 선생님으로 1~2달을 낭비하지 않도록, 처음부터 핏을 맞춥니다.</p>
            </div>

            <div className="lp2-cmp-wrap reveal">
              <table className="lp2-cmp">
                <thead>
                  <tr>
                    <th>비교 항목</th>
                    <th>개인 과외</th>
                    <th className="lp2-col-c lp2-cc">Concord</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRowsCms.map((row) => (
                    <tr key={row.rowIndex}>
                      <td>
                        <CmsEdit active={isEditMode} section="compare" cmsKey={`row${row.rowIndex}_feature`} type="text">
                          {row.feature}
                        </CmsEdit>
                      </td>
                      <td>
                        {row.other === "✗" || row.other === "없음" ? (
                          <>
                            <span className="lp2-no">✗</span>
                            {row.other.replace("✗", "").trim() || "없음"}
                          </>
                        ) : (
                          <CmsEdit active={isEditMode} section="compare" cmsKey={`row${row.rowIndex}_other`} type="text">
                            {row.other}
                          </CmsEdit>
                        )}
                      </td>
                      <td className="lp2-col-c">
                        <span className="lp2-ok">✓</span>
                        <CmsEdit active={isEditMode} section="compare" cmsKey={`row${row.rowIndex}_concord`} type="text">
                          {row.concord.replace(/^✓\s*/, "")}
                        </CmsEdit>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ══ 9. FAQ + FINAL CTA ════════════════════════════ */}
      {showFaq && cms?.faqs && cms.faqs.length > 0 && (
        <section id="faq" className="lp2-sec" style={{ scrollMarginTop: "80px" }}>
          <div className="lp2-wrap">
            <div className="lp2-sec-head reveal">
              <span className="lp2-eyebrow">{kickers.faq}</span>
              <h2>{uiLabels.faqTitle}</h2>
            </div>

            <div className="lp2-faq-list reveal">
              {cms.faqs.slice(0, 5).map((item, i) => (
                <details key={`${i}-${item.q}`} className="lp2-faq-item">
                  <summary>
                    <span className="lp2-faq-q">{item.q}</span>
                    <span className="lp2-faq-ind" aria-hidden="true">+</span>
                  </summary>
                  <p className="lp2-faq-a">{item.a}</p>
                </details>
              ))}
            </div>

            <div className="lp2-cta-row" style={{ marginTop: 32 }}>
              <ConsultationApplyButton className="lp2-btn lp2-btn-acc lp2-btn-sm" source="home_faq">
                {getCmsValue("faq", "consult_cta", "남은 궁금증은 상담으로 물어보세요")}
              </ConsultationApplyButton>
              <Link href="/faq" className="lp2-btn lp2-btn-ghost lp2-btn-sm">
                {uiLabels.viewAllFaq}
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="lp2-sec">
        <div className="lp2-wrap">
          <div className="lp2-cta-band reveal">
            <div>
              <h2 style={{ whiteSpace: "pre-line" }}>
                {getCmsValue("cta", "headline", "판단은 첫 수업을 보고 하셔도 괜찮아요")}
              </h2>
              <p>
                {getCmsValue(
                  "cta",
                  "subtext",
                  "결정은 천천히 하셔도 돼요. 첫 수업이 맞지 않으면 100% 환불해 드립니다. 신청은 30초면 충분해요.",
                )}
              </p>
              <Link href="/refund" className="lp2-cta-band-note">
                *환불정책 참고
              </Link>
            </div>
            <ConsultationApplyButton className="lp2-btn" source="home_cta_band">
              {getCmsValue("cta", "button", "지금 무료 상담 신청하기")}
            </ConsultationApplyButton>
          </div>
        </div>
      </section>
    </div>
  );
}
