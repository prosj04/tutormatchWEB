/**
 * 홈 랜딩 v3 — CMS 조회 계층.
 * 섹션·키·폴백 문구는 v2(LandingPageV2)와 100% 동일하다. 문구는 오너 소관이므로
 * 여기서 새 문장을 만들지 않는다 — 키를 옮기기만 한다.
 */

import type { LandingCmsContent } from "@/lib/cms";
import { formatCmsMultiline, getFeaturedTutorCards, parseCmsVisibility } from "@/lib/cms-page-defaults";

/* ─── 정적 폴백 데이터 (v2와 동일) ─── */

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

/** 수강기간 표시: 만 12개월 미만은 "N개월", 12개월 이상은 만 나이 기준 "N년"(내림). */
export function formatResultDuration(raw: string): string {
  const m = parseInt(String(raw).replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(m) || m <= 0) return raw;
  return m >= 12 ? `${Math.floor(m / 12)}년` : `${m}개월`;
}

export function buildLandingCmsView(cms?: LandingCmsContent) {
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
        // 실제 시험지 사진 확보 전까지 이미지 슬롯 비움 (CMS로만 채움)
        image: getCmsValue("results", `result${n}_image`, ""),
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

  const cmsTestimonials: Array<LandingCmsContent["testimonials"][number] & { title?: string }> =
    cms && cms.testimonials.length > 0
      ? cms.testimonials.slice(0, 4)
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
    process: getCmsValue("home_labels", "kicker_process", "PROCESS"),
    plans: getCmsValue("home_labels", "kicker_plans", "PLANS"),
    reviews: getCmsValue("home_labels", "kicker_reviews", "REVIEWS"),
    results: getCmsValue("home_labels", "kicker_results", "RESULTS"),
    management: getCmsValue("home_labels", "kicker_management", "LEARNING CARE"),
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
    management: getCmsMultiline("management", "headline", "아이가 말해주지 않아도,\n알게 되실 겁니다"),
    managementSubtext: getCmsValue(
      "management",
      "subtext",
      "수업이 없는 날에도 공부는 계속됩니다. 숙제·질문·리포트·학부모 페이지로 아이의 매일을 그대로 보실 수 있습니다.",
    ),
    process: getCmsValue("features", "section_title", "이렇게 진행됩니다"),
    processSubtext: getCmsValue(
      "features",
      "section_subtext",
      "상담과 배정부터 수업 관리, 사후 관리까지 전담 매니저가 처음부터 끝까지 책임집니다.",
    ),
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

export type LandingView = ReturnType<typeof buildLandingCmsView>;
