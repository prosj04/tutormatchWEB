"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { LandingCmsContent } from "@/lib/cms";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { HomeConsultationCtaSection } from "@/components/landing/HomeConsultationCtaSection";
import { TestimonialCard } from "@/components/reviews/TestimonialCard";
import { FloatingConsultationCue } from "@/components/pricing/FloatingConsultationCue";
import { PricingPlansGrid } from "@/components/pricing/PricingPlansGrid";
import { PricingTierToggle } from "@/components/pricing/PricingTierToggle";
import {
  formatCmsMultiline,
  isPublicSectionVisible,
  parseCmsVisibility,
} from "@/lib/cms-page-defaults";
import { buildVisiblePricingPlanItems } from "@/lib/pricing-cms";
import { usePricingSchoolTier } from "@/lib/pricing-tier-preference";
import { isHomePricingOneSubject } from "@/lib/pricing-plans";
import { SiteHeader } from "./SiteHeader";

const HOME_TESTIMONIAL_PREVIEW = 3;
const HOME_FAQ_PREVIEW = 3;

const DEFAULT_RESULT_IMAGES = [
  "/images/teachers/default-male.png",
  "/images/teachers/default-female.png",
  "/images/teachers/default-male.png",
  "/images/teachers/default-female.png",
  "/images/teachers/default-male.png",
  "/images/teachers/default-female.png",
];

/* ─────────────────────────────────────────── data ── */

const tabs = [
  { id: "intro",      label: "서비스 소개" },
  { id: "teachers",   label: "선생님" },
  { id: "management", label: "학습 관리" },
  { id: "process",    label: "진행 방식" },
  { id: "pricing",    label: "요금제" },
];

const stats = [
  { value: "500+",    label: "누적 상담" },
  { value: "1,200+",  label: "매칭 완료" },
  { value: "98%",     label: "학생 만족도" },
];

const results = [
  ["고2 학생", "수학 5등급→", "2등급으로 상승"],
  ["중3 학생", "영어 64점→",  "87점으로 상승"],
  ["고1 학생", "국어 55점→",  "78점으로 상승"],
  ["중2 학생", "수학 85점→",  "100점으로 상승"],
  ["고3 학생", "영어 5등급→", "3등급으로 상승"],
  ["고1 학생", "수학 69점→",  "92점으로 상승"],
];

const teachers = [
  {
    subject: "수학",
    name: "Teacher Noah",
    image: "/images/teachers/default-male.png",
    highlight: "전교꼴등에서 서울대학교 입학했어요",
    careers: ["서울대학교 수리과학부", "입시 수학 7년", "최상위권 심화반 운영"],
  },
  {
    subject: "영어",
    name: "Teacher Olivia",
    image: "/images/teachers/default-female.png",
    highlight: "읽기 습관만 바꿔도 점수는 달라집니다",
    careers: ["연세대학교 영어영문학과", "국제학교/토플 지도", "첨삭 1,800시간+"],
  },
  {
    subject: "물리",
    name: "Teacher Peter",
    image: "/images/teachers/default-male.png",
    highlight: "공식보다 먼저 직관을 세워요",
    careers: ["KAIST 전기및전자공학부", "물리·수학 통합 지도", "STEM 멘토 수상"],
  },
  {
    subject: "국어",
    name: "Teacher Jiwoo",
    image: "/images/teachers/default-female.png",
    highlight: "지문을 읽는 규칙을 훈련합니다",
    careers: ["서울대학교 국어국문학과", "논술 전문 프라이빗", "내신 국어 맞춤 관리"],
  },
  {
    subject: "화학",
    name: "Teacher Quinn",
    image: "/images/teachers/default-male.png",
    highlight: "개념 연결도를 먼저 그립니다",
    careers: ["서울대학교 화학부", "수능 화학 6년", "실험·서술형 병행"],
  },
  {
    subject: "생명",
    name: "Teacher Rachel",
    image: "/images/teachers/default-female.png",
    highlight: "암기를 줄이고 흐름으로 기억하게 합니다",
    careers: ["연세대학교 생화학", "수능 생명 5년", "diagram 정리 전문"],
  },
];

const steps = [
  {
    number: "01",
    title: "무료 상담 신청",
    desc: "학생의 현재 성적, 목표, 성향을 간단히 남겨주세요.",
    img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=840&h=380&fit=crop&q=80",
  },
  {
    number: "02",
    title: "매니저 배정 및 전화 상담",
    desc: "10년 경력 매니저가 학습 상황과 가족의 우선순위를 듣습니다.",
    img: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=840&h=380&fit=crop&q=80",
  },
  {
    number: "03",
    title: "선생님 추천 및 매칭",
    desc: "과목, 성향, 일정에 맞는 선생님 후보를 추천합니다.",
    img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=840&h=380&fit=crop&q=80",
  },
  {
    number: "04",
    title: "수업 시작",
    desc: "첫 수업 후 적합도를 확인하고 필요한 조정을 진행합니다.",
    img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=840&h=380&fit=crop&q=80",
  },
  {
    number: "05",
    title: "학습 리포트 & 관리",
    desc: "진도, 숙제, 질문, 리포트를 한 흐름으로 관리합니다.",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=840&h=380&fit=crop&q=80",
  },
  {
    number: "06",
    title: "",
    desc: "",
    img: "",
  },
];

const testimonials = [
  {
    quote: "공부하러 가서도 시간만 보내던 아이가 처음으로 공부 계획을 직접 잡고 실행했어요. 무조건 아무 선생님이나 매칭하는것이 아니라 정말 아이에 맞는 선생님을 고민하고 찾아주셔서 훨씬 안심됐습니다.",
    info: "고2 수학 · 학부모",
    img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=640&h=520&fit=crop&q=80",
  },

  {
    quote: "공부 잘 하는 선생님보다도 방황하는 아들의 방향을 잡아 줄 만한 선생님이 필요했는데, 정확히 맞는 선생님을 찾아줬어요.\n 무엇보다 아이가 과외쌤처럼 되고 싶다며 열심히 하려고 하는 모습이 보여 정말 만족합니다",
    info: "고3 수학 · 학부모",
    img: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=640&h=520&fit=crop&q=80",
  },

  {
    quote: "숙제와 공부 계획을 등록하고 선생님이랑 같이 점검하니 자연스럽게 매일 공부하게 되더라구요. 성적보다 습관이 먼저 바뀌었어요.",
    info: "중3 영어 · 학생",
    img: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=640&h=520&fit=crop&q=80",
  },

  {
    quote: "제 공부 방법이 맞는지 고민중에 있었는데 저랑 비슷한 공부법의 선생님을 만나니 정말 도움이 많이 되었어요. 조언을 듣고 공부 방법을 개선할 수 있었던 것이 성적 향상에 가장 도움이 된 것 같아요.",
    info: "고3 국어 · 학생",
    img: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=640&h=520&fit=crop&q=80",
  },
];

/* ─────────────────────────────────────────── hooks ── */

function landingHeaderOffset() {
  return window.matchMedia("(min-width: 768px)").matches ? 100 : 64;
}

function useScrollLandingState() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const sections = tabs
      .map((tab) => document.getElementById(tab.id))
      .filter(Boolean) as HTMLElement[];
    const hero = document.getElementById("hero");
    const pricing = document.getElementById("pricing");
    let frameId = 0;

    const updateState = () => {
      frameId = 0;
      const headerOffset = landingHeaderOffset();
      const sectionScrollOffset = headerOffset + 52;
      const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : window.innerHeight;
      const pastHero = window.scrollY > heroBottom - 120;
      const beforePricing =
        !pricing || window.scrollY < pricing.offsetTop - window.innerHeight * 0.15;
      setShowFloating(pastHero && beforePricing);

      const next = [...sections]
        .reverse()
        .find((section) => section.offsetTop - sectionScrollOffset <= window.scrollY);

      if (next?.id) setActiveTab(next.id);
    };

    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateState);
    };

    updateState();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return { activeTab, showFloating };
}

function canUseOptimizedHeroImage(src: string) {
  return src.startsWith("/") || src.startsWith("https://images.unsplash.com/");
}

type ProcessStepItem = {
  number: string;
  title: string;
  desc: string;
  img: string;
};

function processStepPageNumber(step: ProcessStepItem, index: number) {
  const parsed = Number.parseInt(step.number, 10);
  return Number.isFinite(parsed) ? parsed : index + 1;
}

function ProcessStepsCarousel({
  steps,
  index,
  onIndexChange,
}: {
  steps: ProcessStepItem[];
  index: number;
  onIndexChange: (next: number) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const [trackOffset, setTrackOffset] = useState(0);
  const total = steps.length;

  const alignToIndex = useCallback((next: number) => {
    const viewport = viewportRef.current;
    const card = cardRefs.current[next];
    if (!viewport || !card) return;
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    setTrackOffset(cardCenter - viewport.clientWidth / 2);
  }, []);

  useLayoutEffect(() => {
    alignToIndex(index);
  }, [index, alignToIndex, steps.length]);

  useEffect(() => {
    const onResize = () => alignToIndex(index);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [index, alignToIndex]);

  const goPrev = () => onIndexChange(index === 0 ? total - 1 : index - 1);
  const goNext = () => onIndexChange(index === total - 1 ? 0 : index + 1);
  const prevStep = index > 0 ? steps[index - 1] : null;
  const nextStep = index < total - 1 ? steps[index + 1] : null;
  const currentPage = processStepPageNumber(steps[index], index);

  return (
    <>
      <div ref={viewportRef} className="overflow-hidden">
        <div
          className="flex w-max gap-5 transition-transform duration-500 ease-out motion-reduce:transition-none md:gap-6"
          style={{ transform: `translateX(-${trackOffset}px)` }}
        >
          <div
            className="w-[max(1rem,calc(50%-140px))] shrink-0 md:w-[max(1.25rem,calc(50%-190px))]"
            aria-hidden
          />
          {steps.map((step, stepIndex) => (
            <article
              key={step.number}
              ref={(node) => {
                cardRefs.current[stepIndex] = node;
              }}
              className="w-[280px] shrink-0 overflow-hidden rounded-[20px] border border-neutral-20 bg-white shadow-sm md:w-[380px]"
            >
              <div className="relative h-[180px] w-full md:h-[200px]">
                <Image
                  src={step.img}
                  alt={step.title}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 280px, 380px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute bottom-4 left-5 text-4xl font-black leading-none text-white/20">
                  {step.number}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-black text-neutral-100 md:text-xl">{step.title}</h3>
                <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-neutral-80">
                  {step.desc}
                </p>
              </div>
            </article>
          ))}
          <div
            className="w-[max(1rem,calc(50%-140px))] shrink-0 md:w-[max(1.25rem,calc(50%-190px))]"
            aria-hidden
          />
        </div>
      </div>
      {total > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-2 tabular-nums sm:gap-3">
          <button
            type="button"
            onClick={goPrev}
            className="px-1 py-1 text-xl font-black text-neutral-40 transition hover:text-primary sm:text-2xl"
            aria-label="이전 단계"
          >
            ‹
          </button>
          {prevStep ? (
            <button
              type="button"
              onClick={() => onIndexChange(index - 1)}
              className="min-w-[1.25rem] px-0.5 py-1 text-base font-bold text-neutral-30 transition hover:text-neutral-80 sm:text-lg"
              aria-label={`${processStepPageNumber(prevStep, index - 1)}번 단계`}
            >
              {processStepPageNumber(prevStep, index - 1)}
            </button>
          ) : (
            <span className="min-w-[1.25rem] px-0.5 py-1 text-base font-bold text-transparent sm:text-lg" aria-hidden>
              0
            </span>
          )}
          <span className="min-w-[1.25rem] px-0.5 py-1 text-lg font-black text-neutral-100 sm:text-xl">
            {currentPage}
          </span>
          {nextStep ? (
            <button
              type="button"
              onClick={() => onIndexChange(index + 1)}
              className="min-w-[1.25rem] px-0.5 py-1 text-base font-bold text-neutral-30 transition hover:text-neutral-80 sm:text-lg"
              aria-label={`${processStepPageNumber(nextStep, index + 1)}번 단계`}
            >
              {processStepPageNumber(nextStep, index + 1)}
            </button>
          ) : (
            <span className="min-w-[1.25rem] px-0.5 py-1 text-base font-bold text-transparent sm:text-lg" aria-hidden>
              0
            </span>
          )}
          <button
            type="button"
            onClick={goNext}
            className="px-1 py-1 text-xl font-black text-neutral-40 transition hover:text-primary sm:text-2xl"
            aria-label="다음 단계"
          >
            ›
          </button>
        </div>
      ) : null}
    </>
  );
}

/* ─────────────────────────────────────────── sub-components ── */

/* ─────────────────────────────────────────── main ── */

export function LandingPage({ cms }: { cms?: LandingCmsContent }) {
  const { activeTab, showFloating } = useScrollLandingState();
  const [priceTab, setPriceTab] = useState(0);
  const [processIndex, setProcessIndex] = useState(0);
  const [pricingTier, setPricingTier] = usePricingSchoolTier();
  const getCmsValue = (section: string, key: string, fallback: string) =>
    cms?.siteContent[section]?.[key] ?? fallback;
  const getCmsMultiline = (section: string, key: string, fallback: string) =>
    formatCmsMultiline(getCmsValue(section, key, fallback));

  const homePricingItems = useMemo(
    () =>
      buildVisiblePricingPlanItems(cms?.siteContent, pricingTier).filter((item) =>
        isHomePricingOneSubject(item.plan),
      ),
    [cms?.siteContent, pricingTier],
  );

  useEffect(() => {
    setPriceTab(0);
  }, [pricingTier]);
  useEffect(() => {
    setPriceTab((prev) => {
      if (homePricingItems.length === 0) return 0;
      return Math.min(prev, homePricingItems.length - 1);
    });
  }, [homePricingItems.length]);

  const cmsResults = results.flatMap(([student, before, after], index) => {
    const itemNumber = index + 1;
    const vis = getCmsValue("results", `result${itemNumber}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) {
      return [];
    }
    return [
      {
        student: getCmsValue("results", `result${itemNumber}_student`, student),
        before: getCmsValue("results", `result${itemNumber}_before`, before),
        after: getCmsValue("results", `result${itemNumber}_after`, after),
        image: getCmsValue(
          "results",
          `result${itemNumber}_image`,
          DEFAULT_RESULT_IMAGES[index] ?? DEFAULT_RESULT_IMAGES[0],
        ),
      },
    ];
  });
  const doubledResults = cmsResults.length > 0 ? [...cmsResults, ...cmsResults] : [];
  const cmsTeachers = teachers.flatMap((teacher, index) => {
    const itemNumber = index + 1;
    const visFlag = getCmsValue("teachers", `teacher${itemNumber}_visible`, "1");
    if (!parseCmsVisibility(visFlag.trim() === "" ? undefined : visFlag)) {
      return [];
    }
    const careers = getCmsValue(
      "teachers",
      `teacher${itemNumber}_careers`,
      teacher.careers.join("\n"),
    )
      .split("\n")
      .map((career) => career.trim())
      .filter(Boolean);

    return [
      {
        subject: getCmsValue("teachers", `teacher${itemNumber}_subject`, teacher.subject),
        name: getCmsValue("teachers", `teacher${itemNumber}_name`, teacher.name),
        image: getCmsValue("teachers", `teacher${itemNumber}_image`, teacher.image),
        highlight: getCmsValue("teachers", `teacher${itemNumber}_highlight`, teacher.highlight),
        careers: careers.length > 0 ? careers : teacher.careers,
      },
    ];
  });
  const cmsStats = [
    {
      value: getCmsValue("stats", "stat1_number", stats[0].value),
      label: getCmsValue("stats", "stat1_label", stats[0].label),
    },
    {
      value: getCmsValue("stats", "stat2_number", stats[1].value),
      label: getCmsValue("stats", "stat2_label", stats[1].label),
    },
    {
      value: getCmsValue("stats", "stat3_number", stats[2].value),
      label: getCmsValue("stats", "stat3_label", stats[2].label),
    },
  ];
  const cmsTestimonials =
    cms && cms.testimonials.length > 0 ? cms.testimonials : testimonials;
  const homeTestimonials = cmsTestimonials.slice(0, HOME_TESTIMONIAL_PREVIEW);
  const cmsFaqs = cms && cms.faqs.length > 0 ? cms.faqs : [];
  const homeFaqs = cmsFaqs.slice(0, HOME_FAQ_PREVIEW);
  const showReviewsHome = isPublicSectionVisible(
    cms?.siteContent,
    "home_page",
    "show_reviews_section",
    true,
  );
  const showFaqHome = isPublicSectionVisible(cms?.siteContent, "home_page", "show_faq_section", false);
  const showFaqPage = isPublicSectionVisible(cms?.siteContent, "faq_page", "show_page", true);
  const showReviewsPage = isPublicSectionVisible(cms?.siteContent, "reviews_page", "show_page", true);
  const cmsSteps = steps.flatMap((step, index) => {
    const stepNumber = index + 1;
    const vis = getCmsValue("features", `step${stepNumber}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, stepNumber <= 5)) {
      return [];
    }
    return [
      {
        ...step,
        title: getCmsValue("features", `step${stepNumber}_title`, step.title),
        desc: getCmsMultiline("features", `step${stepNumber}_desc`, step.desc),
        img: getCmsValue("features", `step${stepNumber}_image`, step.img) || step.img || steps[0]!.img,
      },
    ];
  });

  useEffect(() => {
    setProcessIndex((prev) => {
      if (cmsSteps.length === 0) return 0;
      return Math.min(prev, cmsSteps.length - 1);
    });
  }, [cmsSteps.length]);

  const managementItems = [1, 2, 3, 4, 5, 6].flatMap((n) => {
    const vis = getCmsValue("management", `item${n}_visible`, n <= 3 ? "1" : "0");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, n <= 3)) {
      return [];
    }
    const defaults: Record<number, { label: string; desc: string }> = {
      1: {
        label: "진도 관리",
        desc: "주간 진도와 목표 달성률을 매니저·가정과 공유합니다.",
      },
      2: {
        label: "질문 관리",
        desc: "복습 질문에 대한 즉각 피드백으로 자기주도 학습을 돕습니다.",
      },
      3: {
        label: "리포트",
        desc: "월간 학습 데이터와 취약 유형 분석을 리포트로 제공합니다.",
      },
    };
    const d = defaults[n] ?? { label: "", desc: "" };
    return [
      {
        label: getCmsValue("management", `item${n}_title`, d.label),
        desc: getCmsMultiline("management", `item${n}_desc`, d.desc),
      },
    ];
  });

  const heroBgImage = getCmsValue("hero", "bg_image_url", "");
  const useOptimizedHeroImage = heroBgImage !== "" && canUseOptimizedHeroImage(heroBgImage);
  const heroStyle = heroBgImage
    ? useOptimizedHeroImage
      ? { background: "linear-gradient(135deg,#111111 0%,#2a2a2a 100%)" }
      : {
        backgroundImage: `linear-gradient(135deg,rgba(17,17,17,0.78),rgba(42,42,42,0.78)), url("${heroBgImage}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: "linear-gradient(135deg,#111111 0%,#2a2a2a 100%)" };

  return (
    <>
      <SiteHeader showFaqLink={showFaqPage} showReviewsLink={showReviewsPage} />

      <main className="text-neutral-100">

        {/* ═══ HERO ═══════════════════════════════════ */}
        <section
          id="hero"
          className="relative flex min-h-[100dvh] flex-col px-4 pb-6 pt-10 text-center sm:px-6 sm:pb-8 md:pt-20 md:pb-10"
          style={heroStyle}
        >
          {useOptimizedHeroImage ? (
            <>
              <Image
                src={heroBgImage}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,17,17,0.78),rgba(42,42,42,0.78))]" />
            </>
          ) : null}
          <div className="absolute inset-0 bg-black/20" />

          {/* centred content */}
          <div className="relative flex flex-1 flex-col items-center justify-center">
            <div className="mx-auto w-full max-w-5xl -translate-y-4 animate-fade-in sm:-translate-y-5 md:-translate-y-7">
            <h1 className="whitespace-pre-line text-[clamp(2.6rem,6vw,5.5rem)] font-black leading-[1.05] tracking-[-0.02em] text-white">
              {getCmsMultiline("hero", "headline", "아이마다 맞는\n선생님이 다릅니다")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl whitespace-pre-line text-base font-medium leading-relaxed tracking-[0.01em] text-neutral-30 md:text-lg">
              {getCmsMultiline(
                "hero",
                "subtext",
                "전문 매니저가 직접 상담하고, 우리 아이에게 꼭 맞는 선생님을 찾아드립니다.",
              )}
            </p>
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <ConsultationApplyButton className="w-full rounded-full bg-primary px-7 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-primary/90 sm:w-auto md:px-8 md:py-4 md:text-base">
                {getCmsValue("hero", "cta_primary", "무료 상담 신청")}
              </ConsultationApplyButton>
              <Link
                href="/tutors"
                className="w-full rounded-full border border-white/30 px-7 py-3.5 text-sm font-black text-white transition hover:bg-white/10 sm:w-auto md:px-8 md:py-4 md:text-base"
              >
                {getCmsValue("hero", "cta_secondary", "선생님 둘러보기")}
              </Link>
            </div>
            </div>
          </div>

          {/* ── Stats — below hero copy ── */}
          <div className="relative mt-8 shrink-0 sm:mt-10 md:mt-12">
            <div className="mx-auto grid max-w-lg grid-cols-3 gap-2 sm:max-w-xl sm:gap-3 md:gap-4">
              {cmsStats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center rounded-xl border border-white/15 bg-white/10 px-2 py-3 backdrop-blur-sm sm:rounded-2xl sm:px-5 sm:py-4 md:px-8 md:py-5"
                >
                  <span className="whitespace-pre-line text-xl font-black leading-none text-primary sm:text-2xl md:text-4xl">
                    {formatCmsMultiline(s.value)}
                  </span>
                  <span className="mt-1 whitespace-pre-line text-center text-[10px] font-medium leading-snug text-white/85 sm:mt-1.5 sm:text-xs md:text-sm">
                    {formatCmsMultiline(s.label)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ STICKY TAB NAV (under SiteHeader on scroll) ═ */}
        <nav className="sticky top-16 z-40 border-b border-neutral-20 bg-white shadow-sm md:top-[100px]">
          <div className="scrollbar-hide mx-auto flex max-w-[1200px] overflow-x-auto px-4 sm:px-5">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className={`relative shrink-0 px-4 py-3 text-sm transition md:px-7 md:py-4 ${
                  activeTab === tab.id ? "font-black text-primary" : "font-bold text-neutral-80"
                }`}
              >
                {tab.label}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${
                    activeTab === tab.id ? "w-full" : "w-0"
                  }`}
                />
              </a>
            ))}
          </div>
        </nav>

        {/* ═══ RESULTS CAROUSEL (intro) ════════════════ */}
        <section id="intro" className="scroll-mt-[7.25rem] overflow-hidden bg-neutral-10 py-20 md:scroll-mt-[9.75rem] md:py-28">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-5">
            <p className="text-sm font-black uppercase tracking-wider text-primary">RESULTS</p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-[-0.03em] text-neutral-100">
              {getCmsValue("results", "section_title", "결과로 증명합니다")}
            </h2>
          </div>
          <div className="animation-container mt-10 overflow-hidden">
            <div className="motion-safe:animate-slide flex w-max gap-5 px-4 [--speed:28s] motion-reduce:animate-none will-change-transform sm:px-5">
              {doubledResults.map((item, index) => (
                <article
                  key={`${item.student}-${index}`}
                  className="w-[min(260px,calc(100vw-2.5rem))] shrink-0 overflow-hidden rounded-[20px] border border-neutral-20 bg-white shadow-sm md:w-[320px]"
                >
                  <div className="relative h-36 w-full">
                    <Image
                      src={item.image}
                      alt={item.student}
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-80">{item.student}</p>
                    <p className="mt-2 text-lg font-black leading-snug text-neutral-100">
                      {item.before}
                      <span className="text-primary">{item.after}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {showFaqHome && homeFaqs.length > 0 ? (
          <section id="faq" className="bg-neutral-10 py-20 md:py-28">
            <div className="mx-auto max-w-[1200px] px-4 sm:px-5">
              <p className="text-sm font-black uppercase tracking-wider text-primary">FAQ</p>
              <h2 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-neutral-100">
                자주 묻는 질문
              </h2>
              <div className="mt-10 divide-y divide-neutral-20 overflow-hidden rounded-[28px] border border-neutral-20 bg-white">
                {homeFaqs.map((item) => (
                  <div key={item.q} className="px-5 py-5 sm:px-6 md:px-8 md:py-7">
                    <p className="font-black text-neutral-100 md:text-lg">Q. {item.q}</p>
                    <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-80 md:text-base">
                      A. {item.a}
                    </p>
                  </div>
                ))}
              </div>
              {showFaqPage ? (
                <div className="mt-8 flex justify-center">
                  <Link
                    href="/faq"
                    className="inline-flex items-center justify-center rounded-full border border-neutral-20 bg-white px-6 py-3 text-sm font-black text-neutral-100 transition hover:border-primary hover:text-primary"
                  >
                    FAQ 더보기
                  </Link>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {showReviewsHome ? (
          <section id="testimonials" className="bg-white py-20 md:py-28">
            <div className="mx-auto max-w-[1200px] px-4 sm:px-5">
              <p className="text-sm font-black uppercase tracking-wider text-primary">REVIEWS</p>
              <h2 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-neutral-100">
                학습 후기
              </h2>
              <div className="mt-10 space-y-5">
                {homeTestimonials.map((t) => (
                  <TestimonialCard key={t.info} item={t} />
                ))}
              </div>
              {showReviewsPage ? (
                <div className="mt-8 flex justify-center">
                  <Link
                    href="/reviews"
                    className="inline-flex items-center justify-center rounded-full border border-neutral-20 bg-white px-6 py-3 text-sm font-black text-neutral-100 transition hover:border-primary hover:text-primary"
                  >
                    학습 후기 더보기
                  </Link>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ═══ TEACHERS — light bg ═════════════════════ */}
        <section id="teachers" className="scroll-mt-[7.25rem] overflow-hidden bg-neutral-10 py-20 md:scroll-mt-[9.75rem] md:py-28">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 sm:px-5 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            {/* sticky heading column */}
            <div className="lg:sticky lg:top-40 lg:self-start">
              <p className="text-sm font-black uppercase tracking-wider text-primary">TEACHERS</p>
              <h2 className="mt-4 whitespace-pre-line text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-[-0.03em] text-neutral-100">
                {getCmsMultiline("teachers", "section_title", "명문대 출신부터\n경력 5년 이상\n전문가까지")}
              </h2>
              <p className="mt-4 max-w-sm whitespace-pre-line text-base font-medium leading-relaxed text-neutral-80">
                {getCmsMultiline(
                  "teachers",
                  "section_subtext",
                  "학생 성향과 목표에 딱 맞는 나만의 선생님을 배정해드립니다.",
                )}
              </p>
              <Link
                href="/tutors"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-neutral-20 bg-white px-5 py-2.5 text-sm font-black text-neutral-100 transition hover:border-primary hover:text-primary"
              >
                {getCmsValue("teachers", "cta", "전체 선생님 보기")}
              </Link>
            </div>

            {/* scrolling teacher cards — light card style */}
            <div className="overflow-hidden">
              <div
                className="motion-safe:animate-marquee-loop flex w-max gap-[var(--marquee-gap)] [--marquee-gap:1.25rem] [--marquee-gap-half:0.625rem] [--speed:34s] motion-reduce:animate-none will-change-transform md:[--marquee-gap:1.5rem] md:[--marquee-gap-half:0.75rem]"
              >
                {[cmsTeachers, cmsTeachers].map((group, groupIndex) => (
                  <div key={`teacher-group-${groupIndex}`} className="flex w-max gap-[var(--marquee-gap)]">
                    {group.map((teacher, index) => (
                      <article
                        key={`${teacher.name}-${groupIndex}-${index}`}
                        className="w-[min(260px,calc(100vw-2.5rem))] shrink-0 rounded-[20px] border border-neutral-20 bg-white p-6 text-center shadow-sm md:w-[300px]"
                      >
                        <div className="mx-auto h-24 w-24 overflow-hidden rounded-[16px] ring-2 ring-neutral-20">
                          <Image
                            src={teacher.image}
                            alt={teacher.name}
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <h3 className="mt-4 text-lg font-black text-neutral-100">{teacher.name} 선생님</h3>
                        <div className="mt-2 flex justify-center">
                          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                            {teacher.subject}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-black leading-snug text-neutral-100">
                          {teacher.highlight.split(" ").slice(0, -2).join(" ")}{" "}
                          <span className="text-primary">
                            {teacher.highlight.split(" ").slice(-2).join(" ")}
                          </span>
                        </p>
                        <ul className="mt-4 space-y-1.5 text-xs font-medium text-neutral-80">
                          {teacher.careers.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ MANAGEMENT ══════════════════════════════ */}
        <section id="management" className="scroll-mt-[7.25rem] bg-white py-20 md:scroll-mt-[9.75rem] md:py-28">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-5">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div className="lg:self-center">
                <p className="text-sm font-black uppercase tracking-wider text-primary">LEARNING CARE</p>
                <h2 className="mt-4 whitespace-pre-line text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-[-0.03em] text-neutral-100">
                  {getCmsMultiline("management", "headline", "수업 밖에서도\n이어지는 학습 관리")}
                </h2>
                <p className="mt-4 max-w-lg whitespace-pre-line text-base font-medium leading-relaxed text-neutral-80">
                  {getCmsMultiline(
                    "management",
                    "subtext",
                    "진도, 숙제, 질문, 리포트를 한 화면에서 연결해 학생·선생님·매니저가 같은 목표를 봅니다.",
                  )}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {managementItems.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="rounded-[20px] bg-neutral-10 p-6">
                    <p className="text-3xl font-black text-primary">{String(index + 1).padStart(2, "0")}</p>
                    <h3 className="mt-5 text-base font-black text-neutral-100">{item.label}</h3>
                    <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-neutral-80">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PROCESS — light bg ══════════════════════ */}
        <section id="process" className="scroll-mt-[7.25rem] bg-neutral-10 py-20 md:scroll-mt-[9.75rem] md:py-28">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-5">
            <p className="text-sm font-black uppercase tracking-wider text-primary">PROCESS</p>
            <h2 className="mt-3 whitespace-pre-line text-[clamp(2rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-neutral-100">
              {getCmsMultiline("features", "section_title", "이렇게 진행됩니다")}
            </h2>
            <p className="mt-3 max-w-2xl whitespace-pre-line text-base font-medium text-neutral-80">
              {getCmsMultiline(
                "features",
                "section_subtext",
                "상담부터 매칭, 수업까지 1:1로 학생의 성장에 집중해요.",
              )}
            </p>
          </div>
          <div className="mt-8">
            <ProcessStepsCarousel
              steps={cmsSteps}
              index={processIndex}
              onIndexChange={setProcessIndex}
            />
          </div>
        </section>

                {/* ═══ PRICING ═════════════════════════════════ */}
        <section id="pricing" className="scroll-mt-[7.25rem] bg-white py-14 sm:py-20 md:scroll-mt-[9.75rem] md:py-28">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-5">
            <div className="grid gap-8 sm:gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div className="lg:self-center">
                <p className="text-sm font-black uppercase tracking-wider text-primary">
                  {getCmsValue("home_page", "pricing_kicker", "PRICE")}
                </p>
                <h2 className="mt-3 text-[clamp(1.75rem,5vw,3.5rem)] font-black leading-tight tracking-[-0.03em] text-neutral-100 sm:mt-4">
                  {getCmsMultiline("home_page", "pricing_title", "1:1 맞춤 과외,\n월 40만원부터")
                    .split("\n")
                    .map((line, index, arr) => (
                      <span key={`${line}-${index}`}>
                        {line}
                        {index < arr.length - 1 ? <br /> : null}
                      </span>
                    ))}
                </h2>
                <p className="mt-4 max-w-sm text-base font-medium leading-relaxed text-neutral-80">
                  {getCmsValue(
                    "home_page",
                    "pricing_subtext",
                    "1과목·2과목(선생님 2명) 패키지는 요금제 페이지에서 확인하세요.",
                  )}
                </p>
                <Link
                  href="/pricing"
                  className="mt-6 inline-flex items-center justify-center rounded-full border border-neutral-20 bg-white px-5 py-2.5 text-sm font-black text-neutral-100 transition hover:border-primary hover:text-primary"
                >
                  {getCmsValue("home_page", "pricing_cta", "요금제 더보기")}
                </Link>
              </div>
              <div>
                {homePricingItems.length > 0 ? (
                  <div>
                    <PricingTierToggle
                      value={pricingTier}
                      onChange={setPricingTier}
                      className="mb-5"
                    />
                    <div className="mb-5 grid grid-cols-2 rounded-full bg-neutral-10 p-1 md:hidden">
                        {homePricingItems.map((item, index) => (
                          <button
                            key={`${pricingTier}-${item.plan.id}`}
                            type="button"
                            onClick={() => setPriceTab(index)}
                            className={`rounded-full py-3 text-sm font-black transition ${
                              priceTab === index ? "bg-primary text-white" : "text-neutral-80"
                            }`}
                          >
                            {item.title ?? item.plan.title}
                          </button>
                        ))}
                      </div>
                    <PricingPlansGrid
                      items={homePricingItems}
                      variant="home"
                      activeIndex={priceTab}
                    />
                  </div>
                ) : (
                  <p className="rounded-2xl border border-neutral-20 bg-neutral-10 px-5 py-8 text-center text-sm text-neutral-80">
                    표시된 요금제가 없습니다. 관리자 「사이트 콘텐츠」에서 요금제 카드를 켜 주세요.
                  </p>
                )}
              </div>
            </div>
            <FloatingConsultationCue
              scrollTargetId="consultation"
              showChevron
              revealOnScroll
              className="relative z-10 pt-14 pb-2 md:pt-20 md:pb-4"
            />
          </div>
        </section>

        <HomeConsultationCtaSection siteContent={cms?.siteContent} />

        {/* ═══ FOOTER ══════════════════════════════════ */}
        <footer className="border-t border-neutral-20 bg-neutral-10">
          <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-5">
            <div className="grid gap-10 border-b border-neutral-20 pb-12 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-black text-neutral-100">상담이 필요하신가요?</h2>
                <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-80">
                  채팅문의 10:00~22:00 · 전화문의 평일 10:00~19:00
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <ConsultationApplyButton className="rounded-full bg-primary px-5 py-2.5 text-sm font-black text-white transition hover:bg-primary/90">
                    채팅 문의
                  </ConsultationApplyButton>
                  <a
                    href="tel:010-0000-0000"
                    className="rounded-full border border-neutral-20 bg-white px-5 py-2.5 text-sm font-black text-neutral-100 transition hover:border-neutral-30"
                  >
                    전화 문의
                  </a>
                </div>
              </div>
              <div className="grid gap-8 text-sm font-bold text-neutral-80 sm:grid-cols-2">
                <div className="space-y-3">
                  <p className="font-black text-neutral-100">서비스</p>
                  <Link href="/tutors"                 className="block transition hover:text-primary">강사진</Link>
                  <Link href="/pricing"                className="block transition hover:text-primary">요금제</Link>
                  {showFaqPage ? (
                    <Link href="/faq" className="block transition hover:text-primary">
                      FAQ
                    </Link>
                  ) : null}
                  <ConsultationApplyButton className="block w-full cursor-pointer bg-transparent p-0 text-left text-sm font-bold text-neutral-80 transition hover:text-primary">
                    상담 신청
                  </ConsultationApplyButton>
                </div>
                <div className="space-y-3">
                  <p className="font-black text-neutral-100">SNS</p>
                  <a href="https://instagram.com"  className="block transition hover:text-primary">Instagram</a>
                  <a href="https://youtube.com"    className="block transition hover:text-primary">YouTube</a>
                  <a href="https://blog.naver.com" className="block transition hover:text-primary">Blog</a>
                </div>
              </div>
            </div>
            <div className="pt-8 text-xs font-medium leading-relaxed text-neutral-80">
              <p>
                상호 주식회사 컨코드에듀케이션 · 대표 홍길동 · 사업자등록번호 123-45-67890
                <br className="hidden sm:block" />
                주소 서울특별시 강남구 테헤란로 000, 00층
              </p>
              <p className="mt-2">이용약관 · 개인정보처리방침 · 환불정책</p>
              <div className="mt-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <p>© {new Date().getFullYear()} Concord Private Tutoring. All rights reserved.</p>
                <Link href="/teacher-portal" className="text-[11px] text-neutral-80 transition hover:text-primary">
                  선생님이신가요?
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <ConsultationApplyButton
        className={`fixed bottom-4 left-4 right-4 z-50 rounded-2xl bg-primary px-6 py-3.5 text-sm font-black text-white shadow-2xl transition duration-300 sm:left-auto sm:right-6 sm:rounded-full md:bottom-8 md:right-8 ${
          showFloating ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        무료 상담 신청
      </ConsultationApplyButton>
    </>
  );
}
