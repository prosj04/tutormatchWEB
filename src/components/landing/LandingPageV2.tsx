"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LandingCmsContent } from "@/lib/cms";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { HallOfFameCarousel, type HallItem } from "@/components/common/HallOfFameCarousel";
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
  { number: "01", title: "무료 상담 신청", desc: "학생의 현재 성적, 목표, 성향을 간단히 남겨주세요. 30초면 충분해요." },
  { number: "02", title: "매니저 배정·진단 상담", desc: "매니저가 방문 상담하며 학생 성향을 파악하고 학습 진단을 제공합니다." },
  { number: "03", title: "선생님 배정", desc: "학습 진단을 바탕으로 함께 고민하여 적합한 선생님을 배정합니다" },
  { number: "04", title: "방문 수업 시작", desc: "첫 수업 날짜를 확정하고 선생님이 방문하여 수업이 시작됩니다." },
  { number: "05", title: "수업 관리", desc: "Concord 앱에서 학습에 관한 모든 현황을 확인할 수 있습니다.\n매니저가 항상 수업의 진행 정도를 감독하며, 언제나 매니저에게 문의하실 수 있습니다." },
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
        label: "학부모 안심리뷰",
        desc: "매 수업이 끝날 때마다 진도, 피드백, 숙제, 다음 일정을 정리해 보내드립니다.",
      },
      2: {
        label: "맞춤형 월간 리포트",
        desc: "우리 아이의 성장과 변화, 취약 유형 분석을 한 달 단위 리포트로 확인하실 수 있습니다.",
      },
      3: {
        label: "매니저 상담",
        desc: "선생님께 직접 말하기 어려운 요청은 매니저에게 전하세요. 수업에 반영되도록 조율합니다.",
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

  const cmsTestimonials: Array<
    LandingCmsContent["testimonials"][number] & { title?: string }
  > =
    cms && cms.testimonials.length > 0
      ? cms.testimonials.slice(0, 3)
      : [
          {
            title: "시간만 보내던 아이가,\n계획을 세우는 아이로",
            quote:
              "공부하러 가서도 시간만 보내던 아이가 처음으로 공부 계획을 직접 잡고 실행했어요. 정말 아이에 맞는 선생님을 찾아주셔서 안심됐습니다.",
            info: "고2 수학 · 학부모",
            img: "",
          },
          {
            title: "방황하던 아이 입에서\n선생님처럼 되고 싶다는 말이",
            quote:
              "방황하는 아들의 방향을 잡아 줄 선생님이 필요했는데, 정확히 맞는 분을 찾아줬어요. 아이가 선생님처럼 되고 싶다며 열심히 합니다.",
            info: "고3 수학 · 학부모",
            img: "",
          },
          {
            title: "성적보다 먼저,\n습관이 바뀌었어요",
            quote:
              "숙제와 공부 계획을 등록하고 선생님이랑 같이 점검하니 자연스럽게 매일 공부하게 됐어요. 성적보다 습관이 먼저 바뀌었어요.",
            info: "중3 영어 · 학생",
            img: "",
          },
        ];

  const kickers = {
    teachers: getCmsValue("home_labels", "kicker_teachers", "TEACHERS"),
    management: getCmsValue("home_labels", "kicker_management", "LEARNING CARE"),
    process: getCmsValue("home_labels", "kicker_process", "PROCESS"),
    plans: getCmsValue("home_labels", "kicker_plans", "PLANS"),
    reviews: getCmsValue("home_labels", "kicker_reviews", "REVIEWS"),
    results: getCmsValue("home_labels", "kicker_results", "RESULTS"),
    compare: getCmsValue("compare", "kicker", "COMPARE"),
    faq: getCmsValue("home_labels", "kicker_faq", "FAQ"),
  };

  const verifyDefaults: [string, string][] = [
    ["01", "서류·학력 인증"],
    ["02", "수업 시연"],
    ["03", "대면 인터뷰"],
  ];
  const verifySteps = verifyDefaults.flatMap(([num, label], index) => {
    const n = index + 1;
    const vis = getCmsValue("tutors_featured", `verify${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) return [];
    return [
      {
        n,
        num: getCmsValue("tutors_featured", `verify${n}_num`, num),
        label: getCmsValue("tutors_featured", `verify${n}_label`, label),
      },
    ];
  });

  const uiLabels = {
    faqTitle: getCmsValue("home_labels", "section_title_faq", "자주 묻는 질문"),
    viewAllTeachers: getCmsValue("home_labels", "cta_view_all_teachers", "선생님 전체 보기 →"),
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
    process: getCmsValue("features", "section_title", "이렇게 진행됩니다"),
    processSubtext: getCmsValue("features", "section_subtext", "상담부터 매칭, 방문 수업까지 전담 매니저가 처음부터 끝까지 책임집니다."),
    teachers: getCmsMultiline("tutors_featured", "home_title", "아무 선생님이나\n소개하지 않습니다"),
    teachersSubtext: getCmsValue(
      "tutors_featured",
      "home_subtext",
      "서류·시연·대면 인터뷰, 3단계 검증을 통과한 선생님만 소개합니다. 마음에 드는 선생님이 있다면 편하게 신청해 보세요 — 매칭은 매니저가 도와드려요.",
    ),
    reviews: getCmsValue("home_labels", "section_title_reviews", "왜 학부모님들은 Concord를 선택했을까요?"),
    plans: getCmsMultiline("home_page", "plans_title", "가격까지 숨김없이 공개합니다"),
    plansSubtext: getCmsValue(
      "home_page",
      "plans_subtext",
      "학습 리포트·매니저 관리·강사 첨삭이 모든 플랜에 포함됩니다. 정확한 요금은 상담에서 아이에 맞춰 안내드려요.",
    ),
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
    cmsTestimonials,
    featuredTutors: getFeaturedTutorCards(cms?.siteContent)
      .filter((c) => c.home)
      .slice(0, 3),
    kickers,
    sectionTitles,
    verifySteps,
    uiLabels,
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
  const [activeStep, setActiveStep] = useState(0); // 우측 목업 + 아코디언 (호버)
  const procListRef = useRef<HTMLDivElement | null>(null);
  const [mockY, setMockY] = useState(0);

  useEffect(() => {
    const list = procListRef.current;
    if (!list) return;
    const item = list.children[activeStep] as HTMLElement | undefined;
    if (!item) return;
    setMockY(item.getBoundingClientRect().top - list.getBoundingClientRect().top);
  }, [activeStep]);

  const {
    getCmsValue,
    getCmsMultiline,
    showFaq,
    showReviews,
    cmsResults,
    doubledResults,
    cmsSteps,
    managementItems,
    cmsTestimonials,
    featuredTutors,
    kickers,
    sectionTitles,
    verifySteps,
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
    const HALL_FALLBACK: [string, string][] = [
      ["연세대학교 합격", "김*연 · 고3 수학"],
      ["고려대학교 합격", "이*준 · 재수 국어"],
      ["성균관대학교 합격", "박*서 · 고3 영어"],
      ["한양대학교 합격", "정*원 · 고3 수학"],
      ["이화여자대학교 합격", "최*아 · 고3 국어"],
      ["서강대학교 합격", "강*민 · 재수 수학"],
      ["중앙대학교 합격", "윤*재 · 고3 영어"],
      ["경희대학교 합격", "임*지 · 고3 과학"],
      ["건국대학교 합격", "한*수 · 고3 수학"],
      ["동국대학교 합격", "서*현 · 고3 국어"],
    ];
    return Array.from({ length: 10 }, (_, i) => i + 1)
      .filter((n) => parseCmsVisibility(getCmsValue("hall", `hall${n}_visible`, "1"), true))
      .map((n) => ({
        image: getCmsValue("hall", `hall${n}_image`, `/images/photos/interviews/int-${n}.jpg`),
        title: getCmsValue("hall", `hall${n}_title`, HALL_FALLBACK[n - 1][0]),
        sub: getCmsValue("hall", `hall${n}_sub`, HALL_FALLBACK[n - 1][1]),
      }))
      .filter((it) => it.title);
  }, [getCmsValue]);

  const safetyStory: SafetyStoryData = useMemo(() => {
    const S = "safety_story";
    const matchDefaults = [
      "활발한 아이에게는 — 끌려가지 않게 잡아주는 선생님",
      "여린 아이에게는 — 틀려도 기다려주는 선생님",
      "게으른 아이에게는 — 옆에서 본보기가 되는 선생님",
    ];
    const stepDefaults = [
      ["대표 직접 면접", "인품, 학력, 신원, 수업 실력.\n4가지 분야를 대표가 직접 전원 면접하고 교육하며, 엄격하게 검증된 선생님만 함께하고 있습니다."],
      ["매니저 직접 매칭", "학생의 공부 성향과 원하는 수업 방향을 상담을 통해 파악하고, 가장 적합한 선생님을 배정합니다."],
      ["공부 계획·질문 관리", "수업보다도 수업 이후 학생의 공부가 성적을 가릅니다.\n매 수업마다 숙제와 공부 계획을 시스템에 등록하고, 선생님은 상시 질의응답과 숙제 피드백을 제공합니다."],
      ["매월 수업 리포트 제공", "누구보다 학생의 공부를 잘 아는 선생님이 매월 직접 리포트를 작성합니다.\n선생님의 생각과 계획을 학생, 학부모와 숨김없이 공유하여 같은 목표로 나아갑니다."],
      ["매니저의 사후 관리", "배정 이후에도 매니저가 상시 관리합니다. 선생님이 맞지 않는다면 언제든 비용 없이 교체할 수 있고,\n언제든 매니저 상담을 요청하실 수 있습니다."],
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
          매니저 진단 메모
          <span className="t">상담 직후</span>
        </div>
        <div className="lp2-notif-rows">
          <div><span className="k">성향</span><span className="v">조용하고 신중한 편 · 질문형 수업 선호</span></div>
          <div><span className="k">목표</span><span className="v">내신 수학 2등급, 기초 개념 재정리</span></div>
          <div><span className="k">일정</span><span className="v">화·목 저녁 / 동탄 자택 방문</span></div>
        </div>
      </div>
      <div className="lp2-proc-mock-note">성적표보다 먼저, 아이가 어떤 학생인지 듣습니다</div>
    </>,
    <>
      <div className="lp2-notif-card">
        <div className="lp2-notif-head">
          <span className="lp2-proof-dot" />
          선생님 후보 도착
          <span className="t">상담 후 1~3일</span>
        </div>
        <p>김서연 선생님 · 서울대 수리과학부 · 수학</p>
        <div className="lp2-notif-tags">
          <span>기다려주는 수업</span>
          <span>화·목 가능</span>
        </div>
      </div>
      <div className="lp2-proc-mock-note">성향과 일정까지 맞는 후보만 제안합니다</div>
    </>,
    <>
      <div className="lp2-notif-card">
        <div className="lp2-notif-head">
          <span className="lp2-proof-dot" />
          첫 수업 확정
          <span className="t">배정 직후</span>
        </div>
        <div className="lp2-notif-rows">
          <div><span className="k">일시</span><span className="v">목요일 19:00 · 자택 방문</span></div>
          <div><span className="k">준비</span><span className="v">교재는 선생님이 안내드립니다</span></div>
        </div>
      </div>
      <div className="lp2-proc-mock-note">날짜를 확정하면 선생님이 방문합니다</div>
    </>,
    <>
      <div className="lp2-notif-card">
        <div className="lp2-notif-head">
          <span className="lp2-proof-dot" />
          오늘 수업 리포트
          <span className="t">수업 직후 발송</span>
        </div>
        <div className="lp2-notif-rows">
          <div><span className="k">진도</span><span className="v">이차함수 그래프 활용</span></div>
          <div><span className="k">숙제</span><span className="v">유형 연습 12문항 · 요일별 배분</span></div>
          <div><span className="k">다음</span><span className="v">목요일 19:00 방문</span></div>
        </div>
      </div>
      <div className="lp2-proc-mock-note">매 수업이 기록으로 남고, 학부모님께 공유됩니다</div>
    </>,
  ];

  /* 케어 목업 — 데스크톱은 우측 칼럼, 모바일은 해당 번호 아래 인라인 */
  const careReportMock = (
    <div className="lp2-report-card">
      <div className="lp2-report-head">
        <span className="lp2-proof-dot" />
        <strong>Concord 학습 리포트</strong>
        <span className="t">6월 리포트</span>
      </div>
      <div className="lp2-report-body">
        <div className="lp2-report-row">
          <span className="k">이달 진도</span>
          <span className="v">이차함수 그래프 활용 (교재 p.84~91)</span>
        </div>
        <div className="lp2-report-row">
          <span className="k">숙제</span>
          <span className="v">유형 연습 12문항 · 오답노트 3개</span>
        </div>
        <div className="lp2-report-row">
          <span className="k">선생님 코멘트</span>
          <span className="v">
            응용 문제에 접근하는 방식이 눈에 띄게 좋아졌습니다. 다음 달은
            실수 유형을 함께 줄여보겠습니다.
          </span>
        </div>
      </div>
      <div className="lp2-report-foot">매월 학습 리포트로 정리해 학부모님께 전달됩니다</div>
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
        <div className="lp2-bubble teacher">
          <span className="who">선생님 · 아침 7:40</span>
          <p>범위 조건을 빼먹었어요. 풀이 써서 보낼게요 — 다음 수업 때 같은 유형 한 번 더 봐요.</p>
        </div>
        <div className="lp2-bubble student">
          <span className="who">학생 · 아침 8:05</span>
          <p>풀이 보니까 바로 이해됐어요! 목요일에 봬요.</p>
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
            <div className="lp2-proc-list" ref={procListRef}>
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
                      setActiveStep(index); // 터치 기기에서는 탭으로 열기
                    }}
                    onFocus={() => setActiveStep(index)}
                  >
                    <span className="lp2-proc-n">{step.number}</span>
                    <span className="lp2-proc-t">{step.title}</span>
                    <span className="lp2-faq-ind" aria-hidden="true">+</span>
                  </summary>
                  <p className="lp2-proc-p" style={{ whiteSpace: "pre-line" }}>{step.desc}</p>
                  <div className="lp2-proc-inline lp2-mobile-only" aria-hidden="true">
                    {procMocks[index]}
                  </div>
                </details>
              ))}
            </div>

            <div
              className="lp2-proc-mock reveal lp2-desktop-only"
              aria-hidden="true"
              style={{
                transform: `translateY(${mockY}px)`,
                transition:
                  "transform .45s cubic-bezier(.22,1,.36,1), opacity 2s cubic-bezier(.45,.05,.25,1)",
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

          {verifySteps.length > 0 && (
            <div className="lp2-verify-row reveal" aria-label="선발 절차">
              {verifySteps.map((v, index) => (
                <span key={v.n} style={{ display: "contents" }}>
                  {index > 0 && (
                    <span className="lp2-verify-sep" aria-hidden="true">→</span>
                  )}
                  <span className="lp2-verify-pill">
                    <em>{v.num}</em> {v.label}
                  </span>
                </span>
              ))}
            </div>
          )}

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

          <div className="lp2-cta-row" style={{ marginTop: 40 }}>
            <Link href="/tutors" className="lp2-btn lp2-btn-ghost">
              {uiLabels.viewAllTeachers}
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 6. LEARNING CARE ══════════════════════════════ */}
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
                    "Concord는 학부모님과 정기적으로 소통합니다. 진도, 숙제, 질문, 리포트를 한 흐름으로 연결합니다.",
                  )}
                </p>
              </div>

              <div className="lp2-care-list">
                {managementItems.map((item) => (
                  <div key={item.n} className="lp2-care-row reveal">
                    <div className="num">0{item.n}</div>
                    <div>
                      <h3>{item.label}</h3>
                      <p>{item.desc}</p>
                      {item.n === 2 ? (
                        <div className="lp2-care-inline lp2-mobile-only" aria-hidden="true">
                          {careReportMock}
                        </div>
                      ) : null}
                      {item.n === 3 ? (
                        <div className="lp2-care-inline lp2-mobile-only" aria-hidden="true">
                          {careQnaMock}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lp2-care-mock reveal lp2-desktop-only" aria-hidden="true">
              {careReportMock}
              {careQnaMock}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 7. RESULTS + REVIEWS ══════════════════════════ */}
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
                {t.gradeFrom && t.gradeTo ? (
                  <div
                    className="lp2-rev-grade"
                    aria-label={`${t.gradeFrom}에서 ${t.gradeTo}로 향상`}
                  >
                    <span className="from">{t.gradeFrom}</span>
                    <span className="arrow" aria-hidden="true">→</span>
                    <span className="to">{t.gradeTo}</span>
                  </div>
                ) : (
                  <div className="quote">&ldquo;</div>
                )}
                {t.title ? (
                  <h3 className="lp2-rev-title" style={{ whiteSpace: "pre-line" }}>
                    {t.title}
                  </h3>
                ) : null}
                <p className="qt">{t.quote}</p>
                <div className="by">{t.info}</div>
              </div>
            ))}
          </div>

          <div className="lp2-cta-row" style={{ marginTop: 40 }}>
            <Link href="/reviews" className="lp2-btn lp2-btn-ghost lp2-btn-sm">
              {uiLabels.viewAllReviews}
            </Link>
          </div>
        </div>
        )}
      </section>

      {/* ══ 8. PRICING ════════════════════════════════════ */}
      <section id="pricing" className="lp2-sec lp2-price-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-price-cols reveal">
            <div className="lp2-price-left">
              <span className="lp2-eyebrow">{kickers.plans}</span>
              <h2 style={{ whiteSpace: "pre-line" }}>{sectionTitles.plans}</h2>
              <p>{sectionTitles.plansSubtext}</p>
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

            <div style={{ marginTop: 32 }}>
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
                {getCmsValue("cta", "subtext", "결정은 천천히 하셔도 돼요. 진단부터 먼저 받아보세요 — 신청은 30초면 충분해요.")}
              </p>
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
