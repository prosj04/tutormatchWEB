/** 공개 페이지별 CMS 섹션 기본값 (seed + 관리자 UI 공용) */

import type { CSSProperties } from "react";
import { getEffectivePhotoUrl } from "@/lib/profile-gender";
import { PRICING_PLANS_V2, type PricingPlanV2 } from "@/lib/pricing-plans";

export { getGenderDefaultPhotoUrl, getEffectivePhotoUrl } from "@/lib/profile-gender";

/** 홈·요금제 등 관리자에서 동일 박스 UI로 노출되는 카드 슬롯 수 (v2: 4개 플랜/tier) */
export const CMS_MANAGED_CARD_SLOT_COUNT = 4;

/** 예: 요금제 CMS 박스 3 → pricing_box_3_title (고등 카드 세트 기본키) */
export function pricingBoxFieldKey(
  boxIndex1Based: number,
  field: "title" | "subtitle" | "price" | "features" | "visible",
): string {
  return `pricing_box_${boxIndex1Based}_${field}`;
}

/** 예: 중등 카드 세트 pricing_middle_box_3_title — 비면 고등 키로 폴백 */
export function pricingMiddleBoxFieldKey(
  boxIndex1Based: number,
  field: "title" | "subtitle" | "price" | "features" | "visible",
): string {
  return `pricing_middle_box_${boxIndex1Based}_${field}`;
}

/** 예: 요금 플랜 id "8-2" → plan_8_2_title */
export function pricingPlanFieldKey(
  planId: string,
  field: "title" | "subtitle" | "price" | "features" | "visible",
): string {
  return `plan_${planId.replace("-", "_")}_${field}`;
}

/** 1 / true 등은 표시, 0 · false · off · 숨김 은 미표시. 빈 문자열은 defaultVisible */
export function parseCmsVisibility(raw: string | undefined, defaultVisible = true): boolean {
  if (raw === undefined || raw === "") return defaultVisible;
  const v = raw.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off" || v === "숨김") return false;
  return true;
}

export function isPublicSectionVisible(
  siteContent: Record<string, Record<string, string>> | undefined,
  section: string,
  key: string,
  defaultVisible = true,
): boolean {
  const raw = siteContent?.[section]?.[key];
  return parseCmsVisibility(raw?.trim() === "" ? undefined : raw, defaultVisible);
}

/** CMS·공개 페이지 제목에서 줄바꿈 제거 */
export function cmsPlainLine(text: string): string {
  return text.replace(/\s*\n+\s*/g, " ").trim();
}

/** CMS 텍스트 크기 옵션 → Tailwind `text-*` */
export const CMS_TEXT_SIZE_OPTIONS = ["sm", "base", "lg", "xl", "2xl", "3xl", "4xl"] as const;
export type CmsTextSize = (typeof CMS_TEXT_SIZE_OPTIONS)[number];

const CMS_TEXT_SIZE_SET = new Set<string>(CMS_TEXT_SIZE_OPTIONS);

export function getCmsTextSizeClass(raw: string | undefined, fallback: string): string {
  const value = raw?.trim();
  if (!value) return fallback;
  if (CMS_TEXT_SIZE_SET.has(value)) return `text-${value}`;
  return fallback;
}

/** CMS bold: "1" → font-bold, "0" → font-normal. 빈 값이면 "" (호출부 fallback 유지) */
export function getCmsTextWeightClass(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return "";
  if (value === "0") return "font-normal";
  if (value === "1") return "font-bold";
  return "";
}

export type CmsTextStyleTarget = {
  section: string;
  key: string;
  defaultSize: CmsTextSize;
  defaultBold: "0" | "1";
};

/** 폰트 크기·볼드 CMS 대상 (seed·관리자 UI 공용) */
export const CMS_TEXT_STYLE_TARGETS: readonly CmsTextStyleTarget[] = [
  { section: "hero", key: "headline", defaultSize: "4xl", defaultBold: "1" },
  { section: "hero", key: "subtext", defaultSize: "lg", defaultBold: "0" },
  { section: "management", key: "headline", defaultSize: "3xl", defaultBold: "1" },
  { section: "management", key: "subtext", defaultSize: "base", defaultBold: "0" },
  { section: "cta", key: "headline", defaultSize: "3xl", defaultBold: "1" },
  { section: "cta", key: "subtext", defaultSize: "base", defaultBold: "0" },
  { section: "pricing_page", key: "header_title", defaultSize: "3xl", defaultBold: "1" },
  { section: "footer", key: "cta_title", defaultSize: "xl", defaultBold: "1" },
] as const;

export function getCmsTextStyleTarget(section: string, key: string): CmsTextStyleTarget | undefined {
  return CMS_TEXT_STYLE_TARGETS.find((t) => t.section === section && t.key === key);
}

export const cmsTextStyleDefaults = CMS_TEXT_STYLE_TARGETS.flatMap((target, index) => [
  {
    section: target.section,
    key: `${target.key}_size`,
    value: target.defaultSize,
    type: "text" as const,
    order: 900 + index * 2,
  },
  {
    section: target.section,
    key: `${target.key}_bold`,
    value: target.defaultBold,
    type: "text" as const,
    order: 901 + index * 2,
  },
]);

export function composeCmsTypographyClass(
  siteContent: Record<string, Record<string, string>> | undefined,
  section: string,
  key: string,
  sizeFallback: string,
  weightFallback: string,
): string {
  const sizeRaw = siteContent?.[section]?.[`${key}_size`];
  const boldRaw = siteContent?.[section]?.[`${key}_bold`];
  return [
    getCmsTextSizeClass(sizeRaw, sizeFallback),
    getCmsTextWeightClass(boldRaw) || weightFallback,
  ]
    .filter(Boolean)
    .join(" ");
}

export type GroupedSiteContent = Record<string, Record<string, string>>;

function cmsSpacingPx(raw: string | undefined): string | undefined {
  const value = raw?.trim();
  if (!value || !/^\d+(\.\d+)?$/.test(value)) return undefined;
  return `${value}px`;
}

/** CMS spacing 섹션 키 → padding inline style (값 없으면 {} → Tailwind 유지) */
export function getCmsSpacing(
  siteContent: GroupedSiteContent | undefined,
  sectionKey: string,
): CSSProperties {
  const spacing = siteContent?.spacing;
  if (!spacing) return {};

  const paddingTop = cmsSpacingPx(spacing[`${sectionKey}_pt`]);
  const paddingBottom = cmsSpacingPx(spacing[`${sectionKey}_pb`]);
  const paddingLeft = cmsSpacingPx(spacing[`${sectionKey}_pl`]);
  const paddingRight = cmsSpacingPx(spacing[`${sectionKey}_pr`]);
  const paddingX = cmsSpacingPx(spacing[`${sectionKey}_px`]);

  const style: CSSProperties = {};
  if (paddingTop) style.paddingTop = paddingTop;
  if (paddingBottom) style.paddingBottom = paddingBottom;
  style.paddingLeft = paddingLeft ?? paddingX ?? undefined;
  style.paddingRight = paddingRight ?? paddingX ?? undefined;
  return style;
}

export const CMS_HOME_SPACING_SECTIONS = [
  { key: "hero", label: "히어로" },
  { key: "stats", label: "통계" },
  { key: "results", label: "결과 (RESULTS)" },
  { key: "teachers", label: "선생님" },
  { key: "management", label: "학습 관리" },
  { key: "features", label: "진행 방식 (PROCESS)" },
  { key: "cta", label: "하단 CTA" },
  { key: "compare", label: "서비스 비교" },
  { key: "faq", label: "FAQ" },
  { key: "reviews", label: "학습 후기" },
  { key: "pricing", label: "요금제" },
  { key: "footer", label: "푸터" },
] as const;

/** 홈 외 페이지 섹션 — admin UI에는 표시되지만 기본값 초기화에는 포함되지 않음 */
export const CMS_EXTRA_SPACING_SECTIONS = [
  { key: "hero_buttons", label: "히어로 - 버튼 그룹" },
  { key: "results_cards", label: "결과 - 카드 목록" },
  { key: "teachers_cards", label: "선생님 - 카드 목록" },
  { key: "management_cards", label: "학습 관리 - 카드 그리드" },
  { key: "features_cards", label: "진행 방식 - 카드 목록" },
  { key: "pricing_cards", label: "홈 요금제 - 카드 영역" },
  { key: "cta_cards", label: "상담 CTA - 혜택 카드" },
  { key: "cta_button", label: "상담 CTA - 신청 버튼" },
  { key: "pricing_header", label: "요금제 페이지 - 헤더" },
  { key: "pricing_plans", label: "요금제 페이지 - 카드 그리드" },
  { key: "pricing_faq_sec", label: "요금제 페이지 - FAQ" },
  { key: "tutors_header", label: "강사진 페이지 - 헤더" },
  { key: "tutors_grid", label: "강사진 페이지 - 카드 그리드" },
  { key: "faq_header", label: "FAQ 페이지 - 헤더" },
  { key: "faq_list", label: "FAQ 페이지 - 목록" },
  { key: "reviews_header", label: "후기 페이지 - 헤더" },
  { key: "reviews_list", label: "후기 페이지 - 목록" },
] as const;

export const CMS_ALL_SPACING_SECTIONS = [
  ...CMS_HOME_SPACING_SECTIONS,
  ...CMS_EXTRA_SPACING_SECTIONS,
] as const;

const CMS_SPACING_DEFAULT_PX = { pt: "80", pb: "80", px: "24", pl: "24", pr: "24" } as const;

export { CMS_SPACING_DEFAULT_PX };

/** 홈 섹션 여백 (section: spacing, 키: {section}_pt|pb|pl|pr|px) */
export const spacingDefaults = CMS_HOME_SPACING_SECTIONS.flatMap((item, index) => {
  const orderBase = index * 5 + 1;
  return [
    {
      section: "spacing" as const,
      key: `${item.key}_pt`,
      value: CMS_SPACING_DEFAULT_PX.pt,
      type: "text" as const,
      order: orderBase,
    },
    {
      section: "spacing" as const,
      key: `${item.key}_pb`,
      value: CMS_SPACING_DEFAULT_PX.pb,
      type: "text" as const,
      order: orderBase + 1,
    },
    {
      section: "spacing" as const,
      key: `${item.key}_pl`,
      value: CMS_SPACING_DEFAULT_PX.pl,
      type: "text" as const,
      order: orderBase + 2,
    },
    {
      section: "spacing" as const,
      key: `${item.key}_pr`,
      value: CMS_SPACING_DEFAULT_PX.pr,
      type: "text" as const,
      order: orderBase + 3,
    },
    {
      section: "spacing" as const,
      key: `${item.key}_px`,
      value: CMS_SPACING_DEFAULT_PX.px,
      type: "text" as const,
      order: orderBase + 4,
    },
  ];
});

function v2DefaultFeatures(plan: PricingPlanV2): string[] {
  const weeklyLabel = plan.weekly === 1 ? "주 1회" : "주 2회";
  const hourLabel = `회당 ${plan.hoursPerLesson}시간`;
  const base = [
    `${weeklyLabel} 수업 · ${hourLabel}`,
    "학습 진도 관리",
    "과제 관리",
    plan.weekly === 2 ? "AI 질답 횟수 2배 제공" : "AI 질답 이용 가능",
    "수시 강사 첨삭, 질답",
  ];
  return base;
}

function pricingBoxRowsForSlot(
  boxIndex: number,
  plan: PricingPlanV2,
  visibleDefault: string,
  orderStart: number,
  keyFn: typeof pricingBoxFieldKey = pricingBoxFieldKey,
) {
  const featuresText = v2DefaultFeatures(plan).join("\n");
  const titleValue = `주 ${plan.weekly}회 · 회당 ${plan.hoursPerLesson}시간`;
  const subtitleValue = `월 ${plan.monthlyHours}시간`;
  return [
    {
      section: "pricing_page" as const,
      key: keyFn(boxIndex, "visible"),
      value: visibleDefault,
      type: "text" as const,
      order: orderStart,
    },
    {
      section: "pricing_page" as const,
      key: keyFn(boxIndex, "title"),
      value: titleValue,
      type: "text" as const,
      order: orderStart + 1,
    },
    {
      section: "pricing_page" as const,
      key: keyFn(boxIndex, "subtitle"),
      value: subtitleValue,
      type: "text" as const,
      order: orderStart + 2,
    },
    {
      section: "pricing_page" as const,
      key: keyFn(boxIndex, "features"),
      value: featuresText,
      type: "text" as const,
      order: orderStart + 3,
    },
  ];
}

/** v2 high plans in order: w1h2, w1h3, w2h2, w2h3 */
const HIGH_V2_PLANS = PRICING_PLANS_V2.filter((p) => p.tier === "high");
/** v2 middle plans in order: w1h2, w1h3, w2h2, w2h3 */
const MIDDLE_V2_PLANS = PRICING_PLANS_V2.filter((p) => p.tier === "middle");

export const pricingPageDefaults = [
  { section: "pricing_page", key: "header_title", value: "투명한 요금,\n꼭 맞는 1:1 과외", type: "text", order: 1 },
  {
    section: "pricing_page",
    key: "header_subtext",
    value: "모든 플랜에 학습 리포트·매니저 관리·강사 첨삭이 포함됩니다. 첫 배정 선생님이 맞지 않으면 추가 비용 없이 재매칭합니다.",
    type: "text",
    order: 2,
  },

  /** 고등 카드 세트 (slots 1–4 = w1h2, w1h3, w2h2, w2h3) */
  ...HIGH_V2_PLANS.flatMap((plan, idx) =>
    pricingBoxRowsForSlot(idx + 1, plan, "1", 3 + idx * 4),
  ),

  /** 중등 카드 세트 — 비워 두면 고등 값으로 폴백 */
  ...MIDDLE_V2_PLANS.flatMap((plan, idx) =>
    pricingBoxRowsForSlot(idx + 1, plan, "1", 130 + idx * 4, pricingMiddleBoxFieldKey),
  ),

  { section: "pricing_page", key: "faq_title", value: "자주 묻는 질문", type: "text", order: 200 },
  {
    section: "pricing_page",
    key: "faq1_q",
    value: "수업 시간과 환불 규정은 어떻게 되나요?",
    type: "text",
    order: 201,
  },
  {
    section: "pricing_page",
    key: "faq1_a",
    value:
      "1회 수업은 50분 기준이며, 개강 전 결제 취소는 전액 환불됩니다. 개강 후에는 잔여 횟수에 비례하여 산정되며, 세부 약관은 계약서에 명시됩니다.",
    type: "text",
    order: 202,
  },
  {
    section: "pricing_page",
    key: "faq2_q",
    value: "강사 변경이 가능한가요?",
    type: "text",
    order: 203,
  },
  {
    section: "pricing_page",
    key: "faq2_a",
    value:
      "첫 2회 수업 이내에만 동일 요금제 범위에서 1회에 한해 변경이 가능합니다. 이후에는 매니저와 별도 협의가 필요합니다.",
    type: "text",
    order: 204,
  },
  {
    section: "pricing_page",
    key: "faq3_q",
    value: "AI 질답은 어떻게 이용하나요?",
    type: "text",
    order: 205,
  },
  {
    section: "pricing_page",
    key: "faq3_a",
    value:
      "가입 시 발급되는 학습 계정으로 24시간 질문이 가능하며, 강사 첨삭 횟수는 선택하신 플랜에 따라 월 4회 또는 무제한 혜택이 적용됩니다.",
    type: "text",
    order: 206,
  },
  {
    section: "pricing_page",
    key: "faq4_q",
    value: "결제 수단은 무엇이 있나요?",
    type: "text",
    order: 207,
  },
  {
    section: "pricing_page",
    key: "faq4_a",
    value: "체크아웃 페이지에서 카드, 간편결제 등 토스페이먼츠에서 제공하는 수단을 선택하실 수 있습니다.",
    type: "text",
    order: 208,
  },
  { section: "pricing_page", key: "cta_title", value: "지금 무료 상담으로 시작해 보세요", type: "text", order: 300 },
  {
    section: "pricing_page",
    key: "cta_subtext",
    value: "학년·과목·목표만 알려주시면 매니저가 하루 안에 맞춤 플랜을 제안합니다.",
    type: "text",
    order: 301,
  },
  { section: "pricing_page", key: "cta_button", value: "무료 상담 신청", type: "text", order: 302 },
  { section: "pricing_page", key: "cta_visible", value: "1", type: "text", order: 303 },
  { section: "pricing_page", key: "header_eyebrow", value: "Plans", type: "text", order: 304 },
  { section: "pricing_page", key: "tier_middle_label", value: "중등", type: "text", order: 305 },
  { section: "pricing_page", key: "tier_high_label", value: "고등", type: "text", order: 306 },
  { section: "pricing_page", key: "assure_pre", value: "처음 배정된 선생님이 맞지 않으면 ", type: "text", order: 307 },
  { section: "pricing_page", key: "assure_strong", value: "추가 비용 없이 다시 매칭", type: "text", order: 308 },
  { section: "pricing_page", key: "assure_post", value: "해 드립니다. 수업료는 월 단위, 언제든 조정 가능합니다.", type: "text", order: 309 },
  { section: "pricing_page", key: "assure_visible", value: "1", type: "text", order: 310 },
  { section: "pricing_page", key: "card_badge_recommend", value: "추천", type: "text", order: 311 },
  { section: "pricing_page", key: "card_per_month", value: "원 / 월", type: "text", order: 312 },
  { section: "pricing_page", key: "card_btn_start", value: "이 플랜으로 시작", type: "text", order: 313 },
  { section: "pricing_page", key: "card_btn_pay", value: "바로 결제하기 →", type: "text", order: 314 },
] as const;

export const tutorsPageDefaults = [
  { section: "tutors_page", key: "header_title", value: "강사진", type: "text", order: 1 },
  {
    section: "tutors_page",
    key: "header_subtext",
    value: "관리자 승인이 완료된 선생님을 확인할 수 있습니다. 카드 내용은 관리자 페이지에서 수정한 정보가 바로 반영됩니다.",
    type: "text",
    order: 2,
  },
  { section: "tutors_page", key: "empty_title", value: "등록된 강사진이 없습니다.", type: "text", order: 3 },
  {
    section: "tutors_page",
    key: "empty_desc",
    value: "승인된 선생님이 생기면 이곳에 표시됩니다.",
    type: "text",
    order: 4,
  },
  {
    section: "tutors_page",
    key: "public_photo_male",
    value: "/images/teachers/default-male.png",
    type: "image",
    order: 5,
  },
  {
    section: "tutors_page",
    key: "public_photo_female",
    value: "/images/teachers/default-female.png",
    type: "image",
    order: 6,
  },
] as const;

/** 이달의 선생님(큐레이션) 카드 수 — 관리자 CMS·공개 페이지 공용 */
export const FEATURED_TUTOR_CARD_COUNT = 15;

/** 예: 카드 2 이름 → featured_2_name */
export function featuredTutorFieldKey(
  cardIndex1Based: number,
  field:
    | "visible"
    | "home_visible"
    | "name"
    | "age"
    | "tag"
    | "university"
    | "subjects"
    | "blurb"
    | "highlights"
    | "photo"
    | "tags"
    | "career_badge",
): string {
  return `featured_${cardIndex1Based}_${field}`;
}

type FeaturedTutorSeed = {
  name: string;
  age: string;
  tag: string;
  university: string;
  subjects: string;
  blurb: string;
  highlights: string;
  photo: string;
  tags: string;
  careerBadge: string;
};

/**
 * 임의(placeholder) 큐레이션 강사 데이터. 관리자 CMS에서 교체 전까지 노출되는 기본값.
 * photo는 기존 성별 기본 얼굴로 채워 둠 — 실제 인물 사진으로 교체 예정.
 * (원하는 사진 방향은 docs/seoltab-teardown.md 부록 메모 참고)
 */
const FEATURED_TUTOR_SEED: FeaturedTutorSeed[] = [
  {
    name: "김서연",
    age: "24",
    tag: "수학",
    university: "서울대학교 수리과학부(수시)",
    subjects: "수학, 미적분, 기하",
    blurb: "개념의 '왜'부터 잡아 스스로 풀어내게 만드는 수업.",
    highlights: "정시 수학 4→1등급 다수 배출\n내신 심화·킬러문항 대비",
    photo: "/images/photos/tutors-sq/t-1.jpg",
    tags: "#개념부터설계\n#킬러문항대비\n#수능수학",
    careerBadge: "3년 이상",
  },
  {
    name: "이준호",
    age: "26",
    tag: "영어",
    university: "연세대학교 영어영문학과(정시)",
    subjects: "영어, 내신, 수능",
    blurb: "구문 독해부터 서술형까지 균형 있게 끌어올립니다.",
    highlights: "내신 1등급 밀착 관리\n수능 영어 1등급 다수 지도",
    photo: "/images/photos/tutors-sq/t-2.jpg",
    tags: "#구문독해\n#서술형첨삭\n#내신영어",
    careerBadge: "4년 이상",
  },
  {
    name: "박지민",
    age: "23",
    tag: "과학",
    university: "고려대학교 화학과(수시)",
    subjects: "화학, 생명과학, 통합과학",
    blurb: "암기 대신 원리로 설계하는 탐구 전략.",
    highlights: "화학·생명 통합 지도\n모의고사 등급 상승 사례 다수",
    photo: "/images/photos/tutors-sq/t-3.jpg",
    tags: "#원리탐구\n#화학생명\n#내신과학",
    careerBadge: "3년 이상",
  },
  {
    name: "최유진",
    age: "25",
    tag: "국어",
    university: "서울대학교 국어교육과(수시)",
    subjects: "국어, 비문학, 논술",
    blurb: "비문학 지문을 구조로 읽어내는 훈련.",
    highlights: "수능 국어 1등급 지도\n논술·서술형 첨삭",
    photo: "/images/photos/tutors-sq/t-4.jpg",
    tags: "#비문학구조독해\n#논술첨삭\n#수능국어",
    careerBadge: "5년 이상",
  },
  {
    name: "정민석",
    age: "27",
    tag: "수학",
    university: "연세대학교 수학과(정시)",
    subjects: "수학, 미적분, 확률과통계",
    blurb: "실수 없는 계산 습관과 킬러문항 접근법.",
    highlights: "미적분·기하 전문\n재수·반수생 정시 관리",
    photo: "/images/photos/tutors-sq/t-5.jpg",
    tags: "#정시수학\n#재수반수관리\n#계산습관교정",
    careerBadge: "4년 이상",
  },
  {
    name: "한소희",
    age: "24",
    tag: "영어",
    university: "고려대학교 영어교육과(수시)",
    subjects: "영어, 내신, 저학년 기초",
    blurb: "말하기·쓰기까지 챙기는 내신 밀착 관리.",
    highlights: "내신 서술형 대비\n저학년 기초 설계",
    photo: "/images/photos/tutors-sq/t-6.jpg",
    tags: "#기초부터탄탄\n#내신밀착관리\n#서술형대비",
    careerBadge: "2년 이상",
  },  {
    name: "강태윤",
    age: "25",
    tag: "수학",
    university: "고려대학교 수학과(정시)",
    subjects: "수학, 내신, 수능",
    blurb: "풀이보다 사고 과정을 교정해 실수를 줄입니다.",
    highlights: "내신 수학 2등급 이내 관리\n오답 패턴 분석 지도",
    photo: "/images/photos/tutors-sq/t-7.jpg",
    tags: "#사고과정교정\n#실수줄이기\n#내신수학",
    careerBadge: "3년 이상",
  },
  {
    name: "윤하은",
    age: "22",
    tag: "영어",
    university: "이화여자대학교 영어교육과(수시)",
    subjects: "영어, 내신, 수능",
    blurb: "단어 암기가 아니라 문장을 읽는 힘을 만듭니다.",
    highlights: "중하위권 기초 세우기 전문\n교육학 기반 커리큘럼",
    photo: "/images/photos/tutors-sq/t-8.jpg",
    tags: "#기초부터\n#교육전공\n#내신영어",
    careerBadge: "1년 이상",
  },
  {
    name: "서지우",
    age: "23",
    tag: "국어",
    university: "성균관대학교 국어국문학과(수시)",
    subjects: "국어, 문학, 비문학",
    blurb: "지문마다 같은 규칙으로 읽는 독해 루틴을 훈련합니다.",
    highlights: "비문학 구조 독해 훈련\n내신 서술형 첨삭",
    photo: "/images/photos/tutors-sq/t-9.jpg",
    tags: "#독해루틴\n#서술형첨삭\n#수능국어",
    careerBadge: "2년 이상",
  },
  {
    name: "김도현",
    age: "21",
    tag: "과학",
    university: "KAIST 생명과학과(수시)",
    subjects: "과학, 물리, 화학",
    blurb: "공식 암기 전에 현상의 원리부터 이해시킵니다.",
    highlights: "물리·화학 개념 연결 수업\n과학고 준비 지도 경험",
    photo: "/images/photos/tutors-sq/t-10.jpg",
    tags: "#원리이해\n#물리화학\n#내신과학",
    careerBadge: "1년 미만",
  },
  {
    name: "이서준",
    age: "24",
    tag: "국어",
    university: "한양대학교 국어교육과(정시)",
    subjects: "국어, 화법과 작문",
    blurb: "말수 적은 학생도 질문하게 만드는 편안한 수업.",
    highlights: "내향적 학생 지도 강점\n수능 국어 1등급 지도",
    photo: "/images/photos/tutors-sq/t-11.jpg",
    tags: "#편안한수업\n#질문유도\n#내신국어",
    careerBadge: "3년 이상",
  },
  {
    name: "박채원",
    age: "26",
    tag: "수학",
    university: "서강대학교 수학과(수시)",
    subjects: "수학, 확률과 통계",
    blurb: "계획표와 숙제 관리로 공부 습관까지 함께 잡습니다.",
    highlights: "주간 학습 계획 밀착 관리\n중등·고1 기초 전문",
    photo: "/images/photos/tutors-sq/t-12.jpg",
    tags: "#습관관리\n#계획밀착\n#기초수학",
    careerBadge: "4년 이상",
  },
  {
    name: "조은우",
    age: "25",
    tag: "영어",
    university: "중앙대학교 영어영문학과(정시)",
    subjects: "영어, 문법, 독해",
    blurb: "문법을 도구로 쓰는 실전형 독해를 가르칩니다.",
    highlights: "어법 실전 적용 훈련\n수능 영어 안정 1등급 지도",
    photo: "/images/photos/tutors-sq/t-13.jpg",
    tags: "#실전어법\n#독해훈련\n#수능영어",
    careerBadge: "3년 이상",
  },
  {
    name: "신예린",
    age: "22",
    tag: "과학",
    university: "경희대학교 화학과(수시)",
    subjects: "과학, 화학, 생명",
    blurb: "그림과 도식으로 개념을 눈에 보이게 정리해 줍니다.",
    highlights: "개념 도식화 노트 지도\n내신 실험·서술형 대비",
    photo: "/images/photos/tutors-sq/t-14.jpg",
    tags: "#도식정리\n#서술형대비\n#내신과학",
    careerBadge: "1년 이상",
  },
  {
    name: "오정연",
    age: "37",
    tag: "국어",
    university: "연세대학교 국어국문학과(수시)",
    subjects: "국어, 논술, 내신",
    blurb: "15년 경력으로 학생마다 다른 처방을 내립니다.",
    highlights: "논술·구술 전문 지도\n최상위권 심화 관리",
    photo: "/images/photos/tutors-sq/t-15.jpg",
    tags: "#베테랑\n#논술전문\n#맞춤처방",
    careerBadge: "15년 이상",
  },

];

/** 이달의 선생님(큐레이션) 섹션 — 디렉터리 대신 소수 카드만 노출, CTA는 상담으로 */
export const tutorsFeaturedDefaults = [
  { section: "tutors_featured", key: "header_kicker", value: "TEACHERS", type: "text", order: 1 },
  { section: "tutors_featured", key: "header_title", value: "이달의 검증 선생님", type: "text", order: 2 },
  {
    section: "tutors_featured",
    key: "header_subtext",
    value:
      "지원자 절반이 탈락하는 선발을 통과한 선생님만 소개합니다. 마음에 드는 선생님이 있다면 편하게 신청해 보세요 — 매칭은 매니저가 도와드려요.",
    type: "text",
    order: 3,
  },
  { section: "tutors_featured", key: "cta_label", value: "빠른 매칭받기", type: "text", order: 4 },
  { section: "tutors_featured", key: "badge_1", value: "첫 수업 후 100% 환불", type: "text", order: 5 },
  { section: "tutors_featured", key: "badge_2", value: "안 맞으면 무료 교체", type: "text", order: 6 },
  { section: "tutors_featured", key: "badge_3", value: "서류·시연·면접 3단계 검증", type: "text", order: 7 },
  ...FEATURED_TUTOR_SEED.flatMap((seed, idx) => {
    const n = idx + 1;
    const orderBase = 10 + idx * 8;
    return [
      { section: "tutors_featured" as const, key: featuredTutorFieldKey(n, "visible"), value: "1", type: "text" as const, order: orderBase },
      { section: "tutors_featured" as const, key: featuredTutorFieldKey(n, "home_visible"), value: n <= 3 ? "1" : "0", type: "text" as const, order: orderBase },
      { section: "tutors_featured" as const, key: featuredTutorFieldKey(n, "name"), value: seed.name, type: "text" as const, order: orderBase + 1 },
      { section: "tutors_featured" as const, key: featuredTutorFieldKey(n, "tag"), value: seed.tag, type: "text" as const, order: orderBase + 2 },
      { section: "tutors_featured" as const, key: featuredTutorFieldKey(n, "university"), value: seed.university, type: "text" as const, order: orderBase + 3 },
      { section: "tutors_featured" as const, key: featuredTutorFieldKey(n, "subjects"), value: seed.subjects, type: "text" as const, order: orderBase + 4 },
      { section: "tutors_featured" as const, key: featuredTutorFieldKey(n, "blurb"), value: seed.blurb, type: "text" as const, order: orderBase + 5 },
      { section: "tutors_featured" as const, key: featuredTutorFieldKey(n, "highlights"), value: seed.highlights, type: "text" as const, order: orderBase + 6 },
      { section: "tutors_featured" as const, key: featuredTutorFieldKey(n, "photo"), value: seed.photo, type: "image" as const, order: orderBase + 7 },
      { section: "tutors_featured" as const, key: featuredTutorFieldKey(n, "tags"), value: seed.tags, type: "text" as const, order: orderBase + 8 },
      { section: "tutors_featured" as const, key: featuredTutorFieldKey(n, "career_badge"), value: seed.careerBadge, type: "text" as const, order: orderBase + 9 },
    ];
  }),
] as const;

/** /tutors 설탭식 재구축 섹션(다크 히어로·통계·인터뷰·Q&A·변경보장·가격 앵커) 기본값 */
export const tutorsBenchmarkDefaults = [
  { section: "tutors_featured", key: "hero_title", value: "우리 아이와 잘 맞는 선생님,\nConcord에는 있습니다", type: "text", order: 101 },
  { section: "tutors_featured", key: "hero_subtext", value: "학습 조건부터 학생 성향까지 정밀하게 맞추는 1:1 매칭", type: "text", order: 102 },
  { section: "tutors_featured", key: "hero_cta", value: "만나보기", type: "text", order: 103 },
  { section: "tutors_featured", key: "hero_image", value: "/images/placeholders/tutors-hero.png", type: "image", order: 104 },
  { section: "tutors_featured", key: "stat1_number", value: "500+", type: "text", order: 110 },
  { section: "tutors_featured", key: "stat1_label", value: "누적 매칭", type: "text", order: 111 },
  { section: "tutors_featured", key: "stat2_number", value: "98%", type: "text", order: 112 },
  { section: "tutors_featured", key: "stat2_label", value: "첫 수업 만족도", type: "text", order: 113 },
  { section: "tutors_featured", key: "stat3_number", value: "47%", type: "text", order: 114 },
  { section: "tutors_featured", key: "stat3_label", value: "선발 통과율", type: "text", order: 115 },
  { section: "tutors_featured", key: "stats_footnote", value: "* Concord 운영 데이터 기준", type: "text", order: 116 },
  { section: "tutors_featured", key: "why_title", value: "Concord 선생님이\n특별한 이유 3가지", type: "text", order: 130 },
  { section: "tutors_featured", key: "why1_q", value: "다 같은 명문대 출신 아닌가요?", type: "text", order: 131 },
  { section: "tutors_featured", key: "why1_a", value: "같은 학벌이어도 다릅니다", type: "text", order: 132 },
  { section: "tutors_featured", key: "why1_desc", value: "서류·수업 시연·대면 인터뷰 3단계로 인성부터 강의력까지 검증합니다.", type: "text", order: 133 },
  { section: "tutors_featured", key: "why2_q", value: "대학생이라 무책임하지 않나요?", type: "text", order: 134 },
  { section: "tutors_featured", key: "why2_a", value: "믿고 맡길 수 있습니다", type: "text", order: 135 },
  { section: "tutors_featured", key: "why2_desc", value: "매 수업이 끝나면 진도와 피드백을 리포트로 공유해 바로 확인할 수 있습니다.", type: "text", order: 136 },
  { section: "tutors_featured", key: "why3_q", value: "교습 경험이 있는 선생님인가요?", type: "text", order: 137 },
  { section: "tutors_featured", key: "why3_a", value: "검증된 경력 위주로 선발합니다", type: "text", order: 138 },
  { section: "tutors_featured", key: "why3_desc", value: "교습 경험과 지도 사례를 확인한 선생님을 우선 배정합니다.", type: "text", order: 139 },
  { section: "tutors_featured", key: "rematch_title", value: "선생님이 마음에 안 들면 어떡하죠?", type: "text", order: 140 },
  { section: "tutors_featured", key: "rematch_subtext", value: "마음에 들 때까지 선생님을 만나보세요. 변경 비용은 0원입니다.", type: "text", order: 141 },
  { section: "tutors_featured", key: "rematch_cta", value: "맞춤 선생님 제안 받기", type: "text", order: 142 },
  { section: "tutors_featured", key: "price_kicker", value: "PLANS", type: "text", order: 149 },
  { section: "tutors_featured", key: "price_title", value: "맞춤수업부터 관리까지, 한 번에", type: "text", order: 150 },
  { section: "tutors_featured", key: "price_subtext", value: "모든 플랜에 학습 리포트·매니저 관리·강사 첨삭이 포함됩니다. 상담 신청은 30초면 충분해요.", type: "text", order: 152 },
  { section: "tutors_proof", key: "section_title", value: "학원에서는 성적이 안 올랐다면?\nConcord 학생들은 지금도 오르고 있습니다", type: "text", order: 1 },
  { section: "tutors_proof", key: "section_footnote", value: "* 학부모·학생 동의를 받아 게재한 사례입니다", type: "text", order: 2 },
  ...[
    { subject: "수학", before: "52점", after: "86점", months: "5개월", student: "경기 일반고 2학년, 박*진 학생" },
    { subject: "영어", before: "3등급", after: "1등급", months: "4개월", student: "서울 일반고 1학년, 김*아 학생" },
    { subject: "국어", before: "61점", after: "88점", months: "6개월", student: "인천 일반고 2학년, 이*준 학생" },
    { subject: "과학", before: "58점", after: "91점", months: "5개월", student: "경기 일반중 3학년, 정*원 학생" },
    { subject: "수학", before: "4등급", after: "2등급", months: "3개월", student: "서울 자사고 2학년, 한*빈 학생" },
    { subject: "영어", before: "47점", after: "79점", months: "4개월", student: "부산 일반고 1학년, 최*서 학생" },
  ].flatMap((p, idx) => {
    const n = idx + 1;
    const orderBase = 10 + idx * 8;
    return [
      { section: "tutors_proof" as const, key: `proof${n}_visible`, value: "1", type: "text" as const, order: orderBase },
      { section: "tutors_proof" as const, key: `proof${n}_subject`, value: p.subject, type: "text" as const, order: orderBase + 1 },
      { section: "tutors_proof" as const, key: `proof${n}_before`, value: p.before, type: "text" as const, order: orderBase + 2 },
      { section: "tutors_proof" as const, key: `proof${n}_after`, value: p.after, type: "text" as const, order: orderBase + 3 },
      { section: "tutors_proof" as const, key: `proof${n}_months`, value: p.months, type: "text" as const, order: orderBase + 4 },
      { section: "tutors_proof" as const, key: `proof${n}_student`, value: p.student, type: "text" as const, order: orderBase + 5 },
      { section: "tutors_proof" as const, key: `proof${n}_image`, value: `/images/placeholders/grade-proof-${n}.png`, type: "image" as const, order: orderBase + 6 },
    ];
  }),
] as const;

/** /reviews 설탭식 개편 섹션(다크 히어로·성공사례·통계 밴드·실물 인증·카테고리) 기본값 */
export const reviewsBenchmarkDefaults = [
  { section: "reviews_page", key: "hero_kicker", value: "REVIEWS", type: "text", order: 101 },
  { section: "reviews_page", key: "hero_title", value: "Concord 학생이 직접 경험한\n성적 상승 후기를 만나보세요", type: "text", order: 102 },
  { section: "reviews_page", key: "hero_subtext", value: "학부모·학생이 직접 남긴 이야기와 변화의 기록입니다.", type: "text", order: 103 },
  { section: "reviews_page", key: "band_title", value: "Concord 학생 대부분이\n첫 3개월 안에 변화를 경험합니다", type: "text", order: 110 },
  { section: "reviews_page", key: "band_stat1_number", value: "98%", type: "text", order: 111 },
  { section: "reviews_page", key: "band_stat1_label", value: "학생 만족도", type: "text", order: 112 },
  { section: "reviews_page", key: "band_stat2_number", value: "500+", type: "text", order: 113 },
  { section: "reviews_page", key: "band_stat2_label", value: "매칭 완료", type: "text", order: 114 },
  { section: "reviews_page", key: "band_footnote", value: "* Concord 운영 데이터 기준", type: "text", order: 115 },
  { section: "reviews_page", key: "list_title", value: "성적보다 습관이\n먼저 바뀌었어요", type: "text", order: 120 },
  {
    section: "reviews_page",
    key: "list_subtext",
    value: "Concord와 함께한 가정의 실제 후기입니다. 비슷한 고민을 골라 살펴보세요.",
    type: "text",
    order: 121,
  },
  { section: "reviews_page", key: "cta_title", value: "우리 아이도 같은 변화를 경험할 수 있어요", type: "text", order: 122 },
  {
    section: "reviews_page",
    key: "cta_subtext",
    value: "무료 상담으로 학생에게 딱 맞는 학습 플랜을 확인해 보세요.",
    type: "text",
    order: 123,
  },
  { section: "reviews_page", key: "cta_button", value: "무료 상담 신청", type: "text", order: 124 },
  { section: "reviews_page", key: "cta_visible", value: "1", type: "text", order: 125 },
  { section: "reviews_success", key: "section_title", value: "숫자로 확인하는\n성적 변화 사례", type: "text", order: 1 },
  {
    section: "reviews_success",
    key: "section_footnote",
    value: "* 학부모·학생 동의를 받아 게재한 사례로, 결과는 학생마다 다를 수 있습니다",
    type: "text",
    order: 2,
  },
  ...[
    { from: "3등급", to: "1등급", result: "고1 화학 내신, 3개월", student: "일반고, 김*아 학생", tags: "#화학\n#내신\n#성적급상승" },
    { from: "4등급", to: "2등급", result: "고3 국어 모의고사, 6개월", student: "일반고, 이*준 학생", tags: "#국어\n#모의고사\n#독해훈련" },
    { from: "64점", to: "87점", result: "중3 영어 학교시험, 4개월", student: "일반중, 박*서 학생", tags: "#영어\n#기초부터" },
    { from: "5등급", to: "2등급", result: "고2 수학 내신, 3개월", student: "일반고, 정*원 학생", tags: "#수학\n#내신" },
    { from: "55점", to: "78점", result: "고1 국어 내신, 3개월", student: "일반고, 한*빈 학생", tags: "#국어\n#공부습관" },
  ].flatMap((c, idx) => {
    const n = idx + 1;
    const orderBase = 10 + idx * 8;
    return [
      { section: "reviews_success" as const, key: `card${n}_visible`, value: "1", type: "text" as const, order: orderBase },
      { section: "reviews_success" as const, key: `card${n}_from`, value: c.from, type: "text" as const, order: orderBase + 1 },
      { section: "reviews_success" as const, key: `card${n}_to`, value: c.to, type: "text" as const, order: orderBase + 2 },
      { section: "reviews_success" as const, key: `card${n}_result`, value: c.result, type: "text" as const, order: orderBase + 3 },
      { section: "reviews_success" as const, key: `card${n}_student`, value: c.student, type: "text" as const, order: orderBase + 4 },
      { section: "reviews_success" as const, key: `card${n}_tags`, value: c.tags, type: "text" as const, order: orderBase + 5 },
    ];
  }),
  { section: "reviews_proof", key: "section_title", value: "기록으로 남은 변화,\n직접 확인해 보세요", type: "text", order: 1 },
  { section: "reviews_proof", key: "section_footnote", value: "* 학부모·학생 동의를 받아 게재한 자료입니다", type: "text", order: 2 },
  ...[
    { student: "고1 화학 | 2025년 수강", comment: "막히는 단원을 정확히 찾아주니 3개월 만에 내신이 달라졌어요" },
    { student: "고3 국어 | 2025년 수강", comment: "지문 읽는 방법부터 훈련하니 모의고사가 안정적으로 올랐어요" },
    { student: "중3 영어 | 2026년 수강", comment: "기초부터 다시 잡아주셔서 시험이 두렵지 않게 됐어요" },
  ].flatMap((p, idx) => {
    const n = idx + 1;
    const orderBase = 10 + idx * 6;
    return [
      { section: "reviews_proof" as const, key: `proof${n}_visible`, value: "1", type: "text" as const, order: orderBase },
      { section: "reviews_proof" as const, key: `proof${n}_image`, value: `/images/placeholders/review-proof-${n}.png`, type: "image" as const, order: orderBase + 1 },
      { section: "reviews_proof" as const, key: `proof${n}_student`, value: p.student, type: "text" as const, order: orderBase + 2 },
      { section: "reviews_proof" as const, key: `proof${n}_comment`, value: p.comment, type: "text" as const, order: orderBase + 3 },
    ];
  }),
] as const;

export type FeaturedTutorCard = {
  index: number;
  home: boolean;
  name: string;
  age: string;
  tag: string;
  university: string;
  subjects: string[];
  blurb: string;
  highlights: string[];
  photo: string;
  tags: string[];
  careerBadge: string;
};

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** CMS 값 우선, 없으면 seed 폴백으로 노출용 큐레이션 강사 카드 배열 생성 */
export function getFeaturedTutorCards(
  siteContent: Record<string, Record<string, string>> | undefined,
): FeaturedTutorCard[] {
  const sec = siteContent?.tutors_featured;
  const cards: FeaturedTutorCard[] = [];
  for (let n = 1; n <= FEATURED_TUTOR_CARD_COUNT; n += 1) {
    const seed = FEATURED_TUTOR_SEED[n - 1];
    const raw = (field: Parameters<typeof featuredTutorFieldKey>[1], fallback: string) =>
      sec?.[featuredTutorFieldKey(n, field)] ?? fallback;
    if (!parseCmsVisibility(sec?.[featuredTutorFieldKey(n, "visible")], Boolean(seed))) continue;
    const name = raw("name", seed?.name ?? "").trim();
    if (!name) continue;
    cards.push({
      index: n,
      home: parseCmsVisibility(sec?.[featuredTutorFieldKey(n, "home_visible")], n <= 3),
      name,
      age: raw("age", seed?.age ?? "").trim(),
      tag: raw("tag", seed?.tag ?? "").trim(),
      university: raw("university", seed?.university ?? "").trim(),
      subjects: splitCsv(raw("subjects", seed?.subjects ?? "")),
      blurb: raw("blurb", seed?.blurb ?? "").trim(),
      highlights: parseMultilineList(raw("highlights", seed?.highlights ?? ""), []),
      photo: raw("photo", seed?.photo ?? "/images/teachers/default-male.png").trim(),
      tags: parseMultilineList(raw("tags", seed?.tags ?? ""), []),
      careerBadge: raw("career_badge", seed?.careerBadge ?? "").trim(),
    });
  }
  return cards;
}

/** 홈 푸터 */
export const footerDefaults = [
  { section: "footer", key: "cta_title", value: "상담이 필요하신가요?", type: "text", order: 1 },
  { section: "footer", key: "hours_chat", value: "채팅문의 10:00~22:00", type: "text", order: 2 },
  { section: "footer", key: "hours_call", value: "전화문의 평일 10:00~19:00", type: "text", order: 3 },
  { section: "footer", key: "btn_chat", value: "채팅 문의", type: "text", order: 4 },
  { section: "footer", key: "btn_phone", value: "전화 문의", type: "text", order: 5 },
  { section: "footer", key: "phone_number", value: "010-0000-0000", type: "text", order: 6 },
  { section: "footer", key: "sns_instagram", value: "https://instagram.com", type: "text", order: 7 },
  { section: "footer", key: "sns_youtube", value: "https://youtube.com", type: "text", order: 8 },
  { section: "footer", key: "sns_blog", value: "https://blog.naver.com", type: "text", order: 9 },
  { section: "footer", key: "company_name", value: "주식회사 컨코드에듀케이션", type: "text", order: 10 },
  { section: "footer", key: "company_rep", value: "홍길동", type: "text", order: 11 },
  { section: "footer", key: "company_reg", value: "123-45-67890", type: "text", order: 12 },
  {
    section: "footer",
    key: "company_address",
    value: "서울특별시 강남구 테헤란로 000, 00층",
    type: "text",
    order: 13,
  },
  {
    section: "footer",
    key: "copyright",
    value: "© {year} Concord Private Tutoring. All rights reserved.",
    type: "text",
    order: 14,
  },
  { section: "footer", key: "label_terms", value: "이용약관", type: "text", order: 15 },
  { section: "footer", key: "label_privacy", value: "개인정보처리방침", type: "text", order: 16 },
  { section: "footer", key: "label_refund", value: "환불정책", type: "text", order: 17 },
  { section: "footer", key: "label_service", value: "서비스", type: "text", order: 18 },
  { section: "footer", key: "label_sns", value: "SNS", type: "text", order: 19 },
  { section: "footer", key: "label_teacher", value: "선생님이신가요?", type: "text", order: 20 },
] as const;

/** 홈 스티키 탭·섹션 kicker·제목 */
export const homeLabelsDefaults = [
  { section: "home_labels", key: "nav_tab_1", value: "서비스 소개", type: "text", order: 1 },
  { section: "home_labels", key: "nav_tab_2", value: "선생님", type: "text", order: 2 },
  { section: "home_labels", key: "nav_tab_3", value: "학습 관리", type: "text", order: 3 },
  { section: "home_labels", key: "nav_tab_4", value: "진행 방식", type: "text", order: 4 },
  { section: "home_labels", key: "nav_tab_5", value: "요금제", type: "text", order: 5 },
  { section: "home_labels", key: "nav_tab_6", value: "서비스 비교", type: "text", order: 6 },
  { section: "home_labels", key: "kicker_results", value: "RESULTS", type: "text", order: 10 },
  { section: "home_labels", key: "kicker_teachers", value: "TEACHERS", type: "text", order: 11 },
  { section: "home_labels", key: "kicker_reviews", value: "REVIEWS", type: "text", order: 12 },
  { section: "home_labels", key: "kicker_management", value: "LEARNING CARE", type: "text", order: 13 },
  { section: "home_labels", key: "kicker_process", value: "PROCESS", type: "text", order: 14 },
  { section: "home_labels", key: "kicker_plans", value: "PLANS", type: "text", order: 15 },
  { section: "home_labels", key: "section_title_faq", value: "자주 묻는 질문", type: "text", order: 16 },
  { section: "home_labels", key: "section_title_reviews", value: "왜 학부모님들은 Concord를 선택했을까요?", type: "text", order: 17 },
  { section: "home_labels", key: "kicker_assurance", value: "RESPONSIBILITY", type: "text", order: 18 },
] as const;

/** 홈 설탭 벤치마크 섹션 (책임 3단계·컨설팅 브릿지·환불 밴드·누적 통계) */
export const homeBenchmarkSectionsDefaults = [
  { section: "hero", key: "model_image", value: "/images/placeholders/hero-thumbnail.png", type: "image", order: 0 },
  { section: "assurance", key: "section_title", value: "선생님 선별부터 매칭, 관리까지\nConcord가 책임집니다", type: "text", order: 1 },
  { section: "assurance", key: "section_subtext", value: "좋은 과외는 좋은 선생님에서 끝나지 않습니다. 선별, 매칭, 그 이후의 관리까지가 저희의 일입니다.", type: "text", order: 2 },
  { section: "assurance", key: "item1_title", value: "깐깐하게 선별합니다", type: "text", order: 3 },
  { section: "assurance", key: "item1_desc", value: "서류·학력 인증, 수업 시연, 대면 인터뷰까지. 지원자 절반이 탈락하는 선발을 통과한 선생님만 소개합니다.", type: "text", order: 4 },
  { section: "assurance", key: "item2_title", value: "전문적으로 매칭합니다", type: "text", order: 5 },
  { section: "assurance", key: "item2_desc", value: "성적표 위 숫자만 보지 않습니다. 학생의 성향과 목표, 공부 습관까지 듣고 가장 잘 가르칠 선생님을 찾습니다.", type: "text", order: 6 },
  { section: "assurance", key: "item3_title", value: "매칭 후에도 관리합니다", type: "text", order: 7 },
  { section: "assurance", key: "item3_desc", value: "좋은 수업을 위해 매칭 이후에도 꾸준한 모니터링과 피드백으로 수업 퀄리티를 약속드립니다.", type: "text", order: 8 },
  { section: "consult_bridge", key: "headline", value: "사교육, 당장 결정이 어렵다면?\n무료 학습컨설팅부터 가볍게 받아보세요", type: "text", order: 1 },
  { section: "consult_bridge", key: "subtext", value: "아이마다 필요한 학습 전략이 다릅니다. 오직 우리 아이 맞춤으로 세워지는 학습 전략, 더 이상의 시간 낭비는 그만.", type: "text", order: 2 },
  { section: "consult_bridge", key: "cta_label", value: "30초, 상담신청 남기기", type: "text", order: 3 },
  { section: "refund_band", key: "headline", value: "첫 수업 후 불만족 시\n100% 환불 보장", type: "text", order: 1 },
  { section: "refund_band", key: "subtext", value: "자신있게 제안합니다. 상담 후 첫 수업까지만 받아보세요.", type: "text", order: 2 },
  { section: "tutors_featured", key: "home_title", value: "아무 선생님이나\n소개하지 않습니다", type: "text", order: 90 },
  { section: "tutors_featured", key: "home_subtext", value: "지원자 절반이 탈락하는 선발을 통과한 선생님만 소개합니다. 마음에 드는 선생님이 있다면 편하게 신청해 보세요 — 매칭은 매니저가 도와드려요.", type: "text", order: 91 },
] as const;

const COMPARE_SEED_ROWS = [
  { feature: "선생님 자격 검증", other: "✗", concord: "✓ 서류·면접" },
  { feature: "선생님 실력 확인", other: "수업 후에야 파악", concord: "✓ 사전 검증" },
  { feature: "학생 맞춤 매칭", other: "직접 알아봐야 함", concord: "✓ 매니저가 성향·과목 맞춰 연결" },
  { feature: "선생님 교체 리스크", other: "맞지 않으면 1~2달 낭비", concord: "✓ 처음부터 핏 맞는 선생님" },
  { feature: "학생 관리", other: "선생님 개인 역량 의존", concord: "✓ 관리 매뉴얼 기반" },
  { feature: "매일 학습 점검", other: "✗", concord: "✓ 일별 플랜" },
  { feature: "질문 답변", other: "수업 시간에만", concord: "✓ 상시 (강사·AI)" },
  { feature: "문제 발생 대응", other: "학부모가 직접 해결", concord: "✓ 전담 매니저 조율" },
  { feature: "학습 기록 공유", other: "✗", concord: "✓ 플랜·기록 공유" },
] as const;

function compareRowSeedRows(orderStart: number) {
  return COMPARE_SEED_ROWS.flatMap((row, index) => {
    const n = index + 1;
    return [
      { section: "compare" as const, key: `row${n}_visible`, value: "1", type: "text" as const, order: orderStart + index * 4 },
      { section: "compare" as const, key: `row${n}_feature`, value: row.feature, type: "text" as const, order: orderStart + index * 4 + 1 },
      { section: "compare" as const, key: `row${n}_concord`, value: row.concord, type: "text" as const, order: orderStart + index * 4 + 2 },
      { section: "compare" as const, key: `row${n}_other`, value: row.other, type: "text" as const, order: orderStart + index * 4 + 3 },
    ];
  });
}

/** 홈 서비스 비교 테이블 */
export const compareDefaults = [
  { section: "compare", key: "kicker", value: "COMPARE", type: "text", order: 0 },
  { section: "compare", key: "table_title", value: "서비스 비교", type: "text", order: 1 },
  ...compareRowSeedRows(2),
] as const;

/** 홈 FAQ·후기·요금제 섹션 기본값 */
export const homePageVisibilityDefaults = [
  { section: "home_page", key: "show_faq_section", value: "1", type: "text", order: 0 },
  { section: "home_page", key: "show_reviews_section", value: "1", type: "text", order: 1 },
  { section: "home_page", key: "plans_title", value: "가격까지 숨김없이 공개합니다", type: "text", order: 3 },
  {
    section: "home_page",
    key: "plans_subtext",
    value: "학습 리포트·매니저 관리·강사 첨삭이 모든 플랜에 포함됩니다. 정확한 요금은 상담에서 아이에 맞춰 안내드려요.",
    type: "text",
    order: 4,
  },
] as const;

/** FAQ·후기·로그인·결제 등 공개 페이지 고정 영역 (항목 본문은 DB 테이블) */
export const extraPublicPagesDefaults = [
  { section: "faq_page", key: "show_page", value: "1", type: "text", order: 0 },
  { section: "faq_page", key: "kicker", value: "FAQ", type: "text", order: 1 },
  {
    section: "faq_page",
    key: "title",
    value: "자주 묻는 질문",
    type: "text",
    order: 2,
  },
  {
    section: "faq_page",
    key: "subtext",
    value: "서비스 이용 전 궁금한 점을 모았습니다.",
    type: "text",
    order: 3,
  },
  { section: "faq_page", key: "empty_text", value: "등록된 FAQ가 없습니다.", type: "text", order: 4 },
  { section: "faq_page", key: "cta_title", value: "지금 무료 상담으로 시작해 보세요", type: "text", order: 5 },
  {
    section: "faq_page",
    key: "cta_subtext",
    value: "학년·과목·목표만 알려주시면 매니저가 하루 안에 맞춤 플랜을 제안합니다.",
    type: "text",
    order: 6,
  },
  { section: "faq_page", key: "cta_button", value: "무료 상담 신청", type: "text", order: 7 },
  { section: "faq_page", key: "cta_visible", value: "1", type: "text", order: 8 },

  { section: "reviews_page", key: "show_page", value: "1", type: "text", order: 0 },
  { section: "reviews_page", key: "kicker", value: "REVIEWS", type: "text", order: 1 },
  { section: "reviews_page", key: "title", value: "학습 후기", type: "text", order: 2 },
  {
    section: "reviews_page",
    key: "subtext",
    value: "실제 학부모·학생이 남긴 후기를 모았습니다.",
    type: "text",
    order: 3,
  },
  {
    section: "reviews_page",
    key: "empty_text",
    value: "등록된 후기가 없습니다.",
    type: "text",
    order: 4,
  },

  { section: "login_page", key: "kicker", value: "Account", type: "text", order: 1 },
  { section: "login_page", key: "title", value: "로그인", type: "text", order: 2 },
  {
    section: "login_page",
    key: "subtext",
    value: "이메일 또는 전화번호와 비밀번호로 Concord 계정에 로그인하세요.",
    type: "text",
    order: 3,
  },
  { section: "login_page", key: "signup_prompt", value: "아직 계정이 없으신가요? ", type: "text", order: 4 },
  { section: "login_page", key: "signup_cta", value: "상담 신청", type: "text", order: 5 },

  { section: "checkout_page", key: "header_kicker", value: "Checkout", type: "text", order: 1 },
  { section: "checkout_page", key: "header_title", value: "결제", type: "text", order: 2 },
  { section: "checkout_page", key: "link_pricing", value: "← 요금제", type: "text", order: 3 },
  { section: "checkout_page", key: "link_consultation", value: "상담 먼저 신청하기", type: "text", order: 4 },
  { section: "checkout_page", key: "section_order_title", value: "주문 요약", type: "text", order: 5 },
  { section: "checkout_page", key: "dt_plan", value: "플랜", type: "text", order: 6 },
  { section: "checkout_page", key: "dt_subjects", value: "과목 수", type: "text", order: 7 },
  { section: "checkout_page", key: "dt_tutor", value: "강사", type: "text", order: 8 },
  { section: "checkout_page", key: "dt_platform", value: "플랫폼 이용료", type: "text", order: 9 },
  { section: "checkout_page", key: "dt_lesson", value: "수업료", type: "text", order: 10 },
  { section: "checkout_page", key: "dt_total", value: "총 결제금액", type: "text", order: 11 },
  { section: "checkout_page", key: "section_payment_title", value: "결제 수단", type: "text", order: 12 },
  {
    section: "checkout_page",
    key: "payment_note",
    value: "테스트 키로 연동되어 실제 결제는 이루어지지 않습니다.",
    type: "text",
    order: 13,
  },
  { section: "checkout_page", key: "section_customer_title", value: "주문자 정보", type: "text", order: 14 },
  { section: "checkout_page", key: "label_name", value: "이름", type: "text", order: 15 },
  { section: "checkout_page", key: "label_phone", value: "연락처", type: "text", order: 16 },
  { section: "checkout_page", key: "label_email", value: "이메일", type: "text", order: 17 },
  {
    section: "checkout_page",
    key: "terms_text",
    value: "전자상거래 및 결제 관련 약관, 개인정보 처리방침에 동의합니다. (필수)",
    type: "text",
    order: 18,
  },
  { section: "checkout_page", key: "pay_button", value: "결제하기", type: "text", order: 19 },
  { section: "checkout_page", key: "paying_label", value: "처리 중…", type: "text", order: 20 },
  { section: "checkout_page", key: "widget_loading", value: "결제 UI를 불러오는 중…", type: "text", order: 21 },
  {
    section: "checkout_page",
    key: "fail_banner",
    value: "결제가 완료되지 않았습니다. 다시 시도하거나 다른 수단을 선택해 주세요.",
    type: "text",
    order: 22,
  },

  { section: "success_page", key: "kicker", value: "Payment", type: "text", order: 1 },
  { section: "success_page", key: "title", value: "결제가 완료되었습니다", type: "text", order: 2 },
  {
    section: "success_page",
    key: "body",
    value: "주문이 정상적으로 접수되었습니다. 담당 매니저가 곧 연락드릴 예정입니다.",
    type: "text",
    order: 3,
  },
  { section: "success_page", key: "label_order", value: "주문번호", type: "text", order: 4 },
  { section: "success_page", key: "label_payment_key", value: "결제키", type: "text", order: 5 },
  { section: "success_page", key: "label_amount", value: "승인 금액", type: "text", order: 6 },
  {
    section: "success_page",
    key: "missing_payment_info",
    value: "결제 확인 정보가 URL에 포함되지 않았습니다. 매니저 확인용 메일을 확인해 주세요.",
    type: "text",
    order: 7,
  },
  { section: "success_page", key: "link_home", value: "홈으로", type: "text", order: 8 },
  { section: "success_page", key: "link_consultation", value: "상담 신청", type: "text", order: 9 },
] as const;

/** 학생·선생님 로그인 후 포털 */
export const portalPagesDefaults = [
  { section: "student_dashboard", key: "brand", value: "Concord.", type: "text", order: 1 },
  {
    section: "student_dashboard",
    key: "planner_title_suffix",
    value: "님의 학습 플래너",
    type: "text",
    order: 2,
  },
  { section: "student_dashboard", key: "logout", value: "로그아웃", type: "text", order: 3 },
  { section: "student_dashboard", key: "btn_add_plan", value: "계획 추가", type: "text", order: 4 },
  { section: "student_dashboard", key: "loading", value: "불러오는 중…", type: "text", order: 5 },
  { section: "student_dashboard", key: "empty_no_plan", value: "이 날짜의 학습 계획이 없습니다.", type: "text", order: 6 },
  {
    section: "student_dashboard",
    key: "empty_hint",
    value: "계획 추가 버튼을 눌러 시작하거나, 이전 날짜에서 복사해 보세요.",
    type: "text",
    order: 7,
  },
  { section: "student_dashboard", key: "btn_copy_prev", value: "이전 날짜에서 복사", type: "text", order: 8 },
  { section: "student_dashboard", key: "label_teacher_comment", value: "선생님 코멘트", type: "text", order: 9 },
  {
    section: "student_dashboard",
    key: "empty_comment",
    value: "아직 코멘트가 없습니다",
    type: "text",
    order: 10,
  },

  { section: "student_consultation", key: "brand", value: "Concord.", type: "text", order: 1 },
  {
    section: "student_consultation",
    key: "welcome_template",
    value: "{name}님 환영합니다",
    type: "text",
    order: 2,
  },
  { section: "student_consultation", key: "logout", value: "로그아웃", type: "text", order: 3 },
  {
    section: "student_consultation",
    key: "toast_assigned",
    value: "매니저가 배정되었습니다!",
    type: "text",
    order: 4,
  },
  {
    section: "student_consultation",
    key: "no_booking_title",
    value: "수업 시작 전 상담을 신청해주세요",
    type: "text",
    order: 5,
  },
  {
    section: "student_consultation",
    key: "no_booking_desc",
    value:
      "상담 신청 후 방문 상담 희망 시간대를 입력해 주세요. 매니저가 확인 후 연락드립니다.",
    type: "text",
    order: 6,
  },
  { section: "student_consultation", key: "note_label", value: "상담 내용 미리 적기 (선택)", type: "text", order: 7 },
  {
    section: "student_consultation",
    key: "note_placeholder",
    value: "학년, 목표 성적, 고민 등을 적어주시면 더 도움이 되는 상담이 가능합니다.",
    type: "text",
    order: 8,
  },
  { section: "student_consultation", key: "btn_submit", value: "상담 신청하기", type: "text", order: 9 },
  { section: "student_consultation", key: "btn_submitting", value: "신청 중...", type: "text", order: 10 },
  { section: "student_consultation", key: "err_submit", value: "상담 신청에 실패했습니다.", type: "text", order: 11 },
  {
    section: "student_consultation",
    key: "err_submit_network",
    value: "상담 신청에 실패했습니다. 다시 시도해주세요.",
    type: "text",
    order: 12,
  },
  {
    section: "student_consultation",
    key: "success_title",
    value: "상담 신청이 완료되었습니다",
    type: "text",
    order: 13,
  },
  {
    section: "student_consultation",
    key: "success_desc",
    value: "아래에서 방문 상담 희망 시간대를 입력해 주세요.",
    type: "text",
    order: 14,
  },
  { section: "student_consultation", key: "card_status_title", value: "내 상담 현황", type: "text", order: 15 },
  { section: "student_consultation", key: "manager_suffix", value: " 매니저", type: "text", order: 16 },
  { section: "student_consultation", key: "manager_role", value: "담당 매니저", type: "text", order: 17 },
  {
    section: "student_consultation",
    key: "visit_section_title",
    value: "방문 상담 희망 시간",
    type: "text",
    order: 18,
  },
  {
    section: "student_consultation",
    key: "visit_prompt",
    value: "방문 상담 희망 시간대를 입력해 주세요.",
    type: "text",
    order: 19,
  },
  {
    section: "student_consultation",
    key: "btn_visit_input",
    value: "방문 상담 희망 시간대 입력",
    type: "text",
    order: 20,
  },
  {
    section: "student_consultation",
    key: "btn_visit_edit",
    value: "방문 상담 희망 시간대 수정",
    type: "text",
    order: 21,
  },
  { section: "student_consultation", key: "btn_close", value: "닫기", type: "text", order: 22 },
  { section: "student_consultation", key: "err_save", value: "저장에 실패했습니다.", type: "text", order: 23 },

  { section: "student_consultation", key: "st_waiting_label", value: "매니저 배정 대기중", type: "text", order: 30 },
  {
    section: "student_consultation",
    key: "st_waiting_body",
    value: "매니저 배정 후 방문 상담 희망 시간을 안내해 주세요.",
    type: "text",
    order: 31,
  },
  { section: "student_consultation", key: "st_assigned_label", value: "매니저 배정 완료", type: "text", order: 32 },
  {
    section: "student_consultation",
    key: "st_assigned_body",
    value: "담당 매니저가 입력하신 방문 시간을 참고하여 연락드립니다.",
    type: "text",
    order: 33,
  },
  { section: "student_consultation", key: "st_completed_label", value: "상담 완료", type: "text", order: 34 },
  {
    section: "student_consultation",
    key: "st_completed_body",
    value: "선생님 매칭을 진행 중입니다.",
    type: "text",
    order: 35,
  },
  { section: "student_consultation", key: "st_cancelled_label", value: "취소됨", type: "text", order: 36 },
  {
    section: "student_consultation",
    key: "st_cancelled_body",
    value: "상담 신청이 취소되었습니다.",
    type: "text",
    order: 37,
  },

  { section: "visit_picker", key: "title", value: "방문 상담 희망 시간대 입력", type: "text", order: 1 },
  {
    section: "visit_picker",
    key: "desc",
    value: "방문 상담 가능 시간대를 입력해주시면 참고하여 연락드리겠습니다.",
    type: "text",
    order: 2,
  },
  { section: "visit_picker", key: "hint_days", value: "오늘부터 7일간 선택 가능합니다.", type: "text", order: 3 },
  {
    section: "visit_picker",
    key: "selected_count",
    value: "선택한 시간대: {count}개",
    type: "text",
    order: 4,
  },
  {
    section: "visit_picker",
    key: "btn_save",
    value: "방문 상담 희망 시간 저장",
    type: "text",
    order: 5,
  },
  { section: "visit_picker", key: "btn_submitting", value: "저장 중...", type: "text", order: 6 },

  { section: "teacher_portal", key: "brand", value: "Concord.", type: "text", order: 1 },
  {
    section: "teacher_portal",
    key: "title_teacher_suffix",
    value: " · 선생님 포털",
    type: "text",
    order: 2,
  },
  {
    section: "teacher_portal",
    key: "title_manager_suffix",
    value: " · 매니저 포털",
    type: "text",
    order: 3,
  },
  { section: "teacher_portal", key: "logout", value: "로그아웃", type: "text", order: 4 },
  { section: "teacher_portal", key: "nav_dashboard", value: "대시보드", type: "text", order: 10 },
  { section: "teacher_portal", key: "nav_profile", value: "프로필 관리", type: "text", order: 11 },
  { section: "teacher_portal", key: "nav_students", value: "학생 관리", type: "text", order: 12 },
  { section: "teacher_portal", key: "nav_matching", value: "매칭 관리", type: "text", order: 13 },
  { section: "teacher_portal", key: "nav_consultations", value: "상담 관리", type: "text", order: 14 },
  { section: "teacher_portal", key: "nav_monitoring", value: "모니터링", type: "text", order: 15 },

  { section: "student_copy_plan", key: "title", value: "이전 날짜에서 복사", type: "text", order: 1 },
  {
    section: "student_copy_plan",
    key: "desc_template",
    value: "{date}에 복사할 이전 날짜를 선택하세요. 할 일은 미완료 상태로 가져옵니다.",
    type: "text",
    order: 2,
  },
  { section: "student_copy_plan", key: "loading", value: "불러오는 중…", type: "text", order: 3 },
  {
    section: "student_copy_plan",
    key: "empty",
    value: "복사할 수 있는 이전 계획이 없습니다.",
    type: "text",
    order: 4,
  },
  { section: "student_copy_plan", key: "task_count_template", value: "할 일 {count}개", type: "text", order: 5 },
  { section: "student_copy_plan", key: "cancel", value: "취소", type: "text", order: 6 },
  { section: "student_copy_plan", key: "apply", value: "적용", type: "text", order: 7 },

  { section: "student_questions", key: "section_title", value: "질문", type: "text", order: 1 },
  { section: "student_questions", key: "btn_add", value: "질문 등록", type: "text", order: 2 },
  {
    section: "student_questions",
    key: "loading",
    value: "질문을 불러오는 중…",
    type: "text",
    order: 3,
  },
  {
    section: "student_questions",
    key: "empty_title",
    value: "이 날짜에 등록된 질문이 없습니다.",
    type: "text",
    order: 4,
  },
  {
    section: "student_questions",
    key: "empty_hint",
    value: "학습 중 궁금한 점을 질문해 보세요.",
    type: "text",
    order: 5,
  },
  {
    section: "student_questions",
    key: "err_upload",
    value: "이미지 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    type: "text",
    order: 6,
  },

  { section: "student_question_modal", key: "title", value: "질문 등록", type: "text", order: 1 },
  { section: "student_question_modal", key: "close", value: "닫기", type: "text", order: 2 },
  { section: "student_question_modal", key: "label_content", value: "질문 내용", type: "text", order: 3 },
  {
    section: "student_question_modal",
    key: "placeholder_content",
    value: "질문 내용을 입력하세요",
    type: "text",
    order: 4,
  },
  { section: "student_question_modal", key: "btn_attach", value: "이미지 첨부", type: "text", order: 5 },
  { section: "student_question_modal", key: "preview_alt", value: "미리보기", type: "text", order: 6 },
  { section: "student_question_modal", key: "btn_remove_image", value: "이미지 제거", type: "text", order: 7 },
  {
    section: "student_question_modal",
    key: "err_invalid_image",
    value: "JPEG, PNG, HEIC 형식만 업로드할 수 있습니다.",
    type: "text",
    order: 8,
  },
  {
    section: "student_question_modal",
    key: "err_empty",
    value: "질문 내용을 입력해 주세요.",
    type: "text",
    order: 9,
  },
  {
    section: "student_question_modal",
    key: "err_submit",
    value: "질문 등록에 실패했습니다.",
    type: "text",
    order: 10,
  },
  { section: "student_question_modal", key: "btn_submitting", value: "등록 중…", type: "text", order: 11 },
  { section: "student_question_modal", key: "btn_submit", value: "질문 등록", type: "text", order: 12 },

  { section: "student_task_list", key: "btn_add_task", value: "할 일 추가", type: "text", order: 1 },
] as const;

/** 관리자 CMS 표시용 라벨 (portalPagesDefaults 키와 대응) */
export const portalPagesFieldLabels: Record<string, Record<string, string>> = {
  student_dashboard: {
    brand: "헤더 브랜드 텍스트",
    planner_title_suffix: "플래너 제목 접미사 (앞에 이름)",
    logout: "로그아웃",
    btn_add_plan: "「계획 추가」버튼",
    loading: "로딩 문구",
    empty_no_plan: "계획 없음 안내",
    empty_hint: "빈 상태 힌트",
    btn_copy_prev: "「이전 날짜에서 복사」",
    label_teacher_comment: "선생님 코멘트 라벨",
    empty_comment: "코멘트 없을 때",
  },
  student_consultation: {
    brand: "헤더 브랜드",
    welcome_template: "환영 문구 ({name})",
    logout: "로그아웃",
    toast_assigned: "매니저 배정 토스트",
    no_booking_title: "상담 전 안내 제목",
    no_booking_desc: "상담 전 안내 설명",
    note_label: "메모 라벨",
    note_placeholder: "메모 placeholder",
    btn_submit: "상담 신청 버튼",
    btn_submitting: "신청 중 버튼",
    err_submit: "신청 오류",
    err_submit_network: "신청 네트워크 오류",
    success_title: "신청 완료 제목",
    success_desc: "신청 완료 설명",
    card_status_title: "상담 현황 카드 제목",
    manager_suffix: "매니저 이름 뒤 접미사",
    manager_role: "담당 매니저 라벨",
    visit_section_title: "방문 시간 블록 제목",
    visit_prompt: "방문 시간 미입력 안내",
    btn_visit_input: "방문 시간 입력 버튼",
    btn_visit_edit: "방문 시간 수정",
    btn_close: "닫기",
    err_save: "방문 시간 저장 오류",
    st_waiting_label: "상태 배지 · 대기",
    st_waiting_body: "상태 본문 · 대기",
    st_assigned_label: "상태 배지 · 배정",
    st_assigned_body: "상태 본문 · 배정",
    st_completed_label: "상태 배지 · 완료",
    st_completed_body: "상태 본문 · 완료",
    st_cancelled_label: "상태 배지 · 취소",
    st_cancelled_body: "상태 본문 · 취소",
  },
  visit_picker: {
    title: "패널 제목",
    desc: "패널 설명",
    hint_days: "7일 선택 안내",
    selected_count: "선택 개수 ({count})",
    btn_save: "저장 버튼",
    btn_submitting: "저장 중",
  },
  teacher_portal: {
    brand: "헤더 브랜드",
    title_teacher_suffix: "헤더 제목 접미사 · 선생님 ({name}님 앞)",
    title_manager_suffix: "헤더 제목 접미사 · 매니저",
    logout: "로그아웃",
    nav_dashboard: "네비 · 대시보드",
    nav_profile: "네비 · 프로필 관리",
    nav_students: "네비 · 학생 관리",
    nav_matching: "네비 · 매칭 관리",
    nav_consultations: "네비 · 상담 관리",
    nav_monitoring: "네비 · 모니터링",
  },
  student_copy_plan: {
    title: "모달 제목",
    desc_template: "설명 ({date})",
    loading: "목록 로딩",
    empty: "복사 가능 계획 없음",
    task_count_template: "날짜 행 부가 ({count})",
    cancel: "취소",
    apply: "적용",
  },
  student_questions: {
    section_title: "섹션 제목",
    btn_add: "질문 등록 버튼",
    loading: "목록 로딩",
    empty_title: "빈 목록 제목",
    empty_hint: "빈 목록 힌트",
    err_upload: "이미지 업로드 오류",
  },
  student_question_modal: {
    title: "모달 제목",
    close: "닫기",
    label_content: "본문 라벨",
    placeholder_content: "본문 placeholder",
    btn_attach: "이미지 첨부",
    preview_alt: "미리보기 alt",
    btn_remove_image: "이미지 제거",
    err_invalid_image: "형식 오류",
    err_empty: "빈 내용 오류",
    err_submit: "등록 오류",
    btn_submitting: "등록 중",
    btn_submit: "등록 버튼",
  },
  student_task_list: {
    btn_add_task: "할 일 추가 버튼",
  },
};

/** CMS textarea 줄바꿈(\\n, \\r\\n, literal \\n, &lt;br&gt;)을 화면 줄바꿈으로 통일 */
export function formatCmsMultiline(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
}

export function parseMultilineList(value: string, fallback: string[]) {
  const lines = formatCmsMultiline(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : fallback;
}

export function getCmsSectionValue(
  siteContent: Record<string, Record<string, string>> | undefined,
  section: string,
  key: string,
  fallback: string,
) {
  return siteContent?.[section]?.[key] ?? fallback;
}

/** 강사진 공개 목록·상세: 개별 photoUrl 우선, 없으면 CMS 성별 기본 얼굴 */
export function getTutorPublicPhotoUrl(
  gender: string | null | undefined,
  siteContent: Record<string, Record<string, string>> | undefined,
  photoUrl?: string | null,
): string {
  return getEffectivePhotoUrl(photoUrl, gender, siteContent);
}

/** 홈 안전 스토리(스크롤텔링) 섹션 기본값 */
export const homeSafetyStoryDefaults = [
  { section: "safety_story", key: "intro", value: "과외는 많은 학생에게 최고의 해결책이지만..", type: "text", order: 1 },
  { section: "safety_story", key: "news1_quote", value: "“딸이 유혹했다” 적반하장 대학생 과외 교사… 1심 집행유예에 ‘공분’", type: "text", order: 10 },
  { section: "safety_story", key: "news1_press", value: "뉴시스", type: "text", order: 11 },
  { section: "safety_story", key: "news1_year", value: "2026", type: "text", order: 12 },
  { section: "safety_story", key: "news1_url", value: "https://www.newsis.com/view/NISX20260410_0003585764", type: "text", order: 13 },
  { section: "safety_story", key: "news2_quote", value: "‘정**’ 사건에 불안 커진 과외 중개 앱…", type: "text", order: 14 },
  { section: "safety_story", key: "news2_press", value: "서울신문", type: "text", order: 15 },
  { section: "safety_story", key: "news2_year", value: "2023", type: "text", order: 16 },
  { section: "safety_story", key: "news2_url", value: "https://www.seoul.co.kr/news/newsView.php?id=20230604500093", type: "text", order: 17 },
  { section: "safety_story", key: "news3_quote", value: "학원 화장실에 ‘몰래카메라 설치’… 警, 50대 원장 입건", type: "text", order: 18 },
  { section: "safety_story", key: "news3_press", value: "경인일보", type: "text", order: 19 },
  { section: "safety_story", key: "news3_year", value: "2020", type: "text", order: 20 },
  { section: "safety_story", key: "news3_url", value: "https://www.kyeongin.com/article/1523526", type: "text", order: 21 },
  { section: "safety_story", key: "news_note", value: "실제 보도된 사건입니다 · 각 항목은 원문 기사로 연결됩니다", type: "text", order: 29 },
  { section: "safety_story", key: "tutors_lead", value: "대표가 모든 선생님을 직접 만나는 이유", type: "text", order: 26 },
  { section: "safety_story", key: "match1", value: "활발한 아이에게는 — 끌려가지 않게 잡아주는 선생님", type: "text", order: 31 },
  { section: "safety_story", key: "match2", value: "여린 아이에게는 — 틀려도 기다려주는 선생님", type: "text", order: 32 },
  { section: "safety_story", key: "match3", value: "게으른 아이에게는 — 옆에서 본보기가 되는 선생님", type: "text", order: 33 },
  { section: "safety_story", key: "closer", value: "아이가 다르면, 선생님도 달라야 합니다", type: "text", order: 35 },
  { section: "safety_story", key: "pivot", value: "우리는 직접 만나고,\n학생에게 맞춥니다", type: "text", order: 40 },
  { section: "safety_story", key: "step1_title", value: "대표 직접 면접", type: "text", order: 50 },
  { section: "safety_story", key: "step1_desc", value: "인품, 학력, 신원, 수업 실력.\n4가지 분야를 대표가 직접 전원 면접하고 교육하며, 엄격하게 검증된 선생님만 함께하고 있습니다.", type: "text", order: 51 },
  { section: "safety_story", key: "step2_title", value: "매니저 직접 매칭", type: "text", order: 52 },
  { section: "safety_story", key: "step2_desc", value: "학생의 공부 성향과 원하는 수업 방향을 상담을 통해 파악하고, 가장 적합한 선생님을 배정합니다.", type: "text", order: 53 },
  { section: "safety_story", key: "step3_title", value: "공부 계획·질문 관리", type: "text", order: 54 },
  { section: "safety_story", key: "step3_desc", value: "수업보다도 수업 이후 학생의 공부가 성적을 가릅니다.\n매 수업마다 숙제와 공부 계획을 시스템에 등록하고, 선생님은 상시 질의응답과 숙제 피드백을 제공합니다.", type: "text", order: 55 },
  { section: "safety_story", key: "step4_title", value: "매월 수업 리포트 제공", type: "text", order: 56 },
  { section: "safety_story", key: "step4_desc", value: "누구보다 학생의 공부를 잘 아는 선생님이 매월 직접 리포트를 작성합니다.\n선생님의 생각과 계획을 학생, 학부모와 숨김없이 공유하여 같은 목표로 나아갑니다.", type: "text", order: 57 },
  { section: "safety_story", key: "step5_title", value: "매니저의 사후 관리", type: "text", order: 58 },
  { section: "safety_story", key: "step5_desc", value: "배정 이후에도 매니저가 상시 관리합니다. 선생님이 맞지 않는다면 언제든 비용 없이 교체할 수 있고,\n언제든 매니저 상담을 요청하실 수 있습니다.", type: "text", order: 59 },
];

/** 합격 인터뷰 카드 캐러셀 기본값 (파일럿 전 임시 콘텐츠) */
export const hallOfFameDefaults = [
  { section: "hall", key: "section_title", value: "합격으로 증명한 학생들", type: "text", order: 1 },
  ...[
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
  ].flatMap(([title, sub], i) => [
    { section: "hall", key: `hall${i + 1}_visible`, value: "1", type: "text", order: 10 + i * 4 },
    { section: "hall", key: `hall${i + 1}_image`, value: `/images/photos/interviews/int-${i + 1}.jpg`, type: "image", order: 11 + i * 4 },
    { section: "hall", key: `hall${i + 1}_title`, value: title, type: "text", order: 12 + i * 4 },
    { section: "hall", key: `hall${i + 1}_sub`, value: sub, type: "text", order: 13 + i * 4 },
  ]),
];

/** 공개 상담신청(/consult) 기본값 — 어드민 편집 가능하도록 등록 */
export const consultPageDefaults = [
  { section: "consult_page", key: "headline", value: "상담 신청만 해도 학습 전문가의 1:1 학습진단 제공", type: "text", order: 1 },
  { section: "consult_page", key: "subtext", value: "정확한 상담 정보를 입력해 주세요.", type: "text", order: 2 },
  { section: "consult_page", key: "benefit_1", value: "무료 학습진단 리포트", type: "text", order: 3 },
  { section: "consult_page", key: "benefit_2", value: "전담 매니저 1:1 상담", type: "text", order: 4 },
  { section: "consult_page", key: "benefit_3", value: "첫 수업 100% 환불 보장", type: "text", order: 5 },
  { section: "consult_page", key: "phone_notice", value: "*신청 후 1영업일 내에 담당 매니저가 연락드립니다.", type: "text", order: 6 },
  { section: "consult_page", key: "label_name", value: "이름", type: "text", order: 7 },
  { section: "consult_page", key: "ph_name", value: "학생 이름", type: "text", order: 8 },
  { section: "consult_page", key: "label_gender", value: "성별", type: "text", order: 9 },
  { section: "consult_page", key: "label_grade", value: "학년", type: "text", order: 10 },
  { section: "consult_page", key: "ph_grade", value: "2026년 기준 학년", type: "text", order: 11 },
  { section: "consult_page", key: "label_phone", value: "연락처", type: "text", order: 12 },
  { section: "consult_page", key: "label_region", value: "지역", type: "text", order: 13 },
  { section: "consult_page", key: "label_subjects", value: "과목", type: "text", order: 14 },
  { section: "consult_page", key: "label_time", value: "희망 상담 시간", type: "text", order: 15 },
  { section: "consult_page", key: "ph_time", value: "상담시간 선택", type: "text", order: 16 },
  { section: "consult_page", key: "agree_all", value: "약관 전체 동의", type: "text", order: 17 },
  { section: "consult_page", key: "agree_privacy", value: "[필수] 상담을 위한 개인정보 수집·이용 동의", type: "text", order: 18 },
  { section: "consult_page", key: "agree_marketing", value: "[선택] 마케팅 활용 동의", type: "text", order: 19 },
  { section: "consult_page", key: "btn_submit", value: "상담 신청하기", type: "text", order: 20 },
  { section: "consult_page", key: "btn_submitting", value: "신청 중…", type: "text", order: 21 },
  { section: "consult_page", key: "done_title", value: "상담 신청이 접수됐어요", type: "text", order: 22 },
  { section: "consult_page", key: "done_check_label", value: "상담에서 확인하실 것", type: "text", order: 23 },
  { section: "consult_page", key: "done_item_1", value: "학생의 공부 성향 진단과 그에 맞는 선생님 방향", type: "text", order: 24 },
  { section: "consult_page", key: "done_item_2", value: "과목별 현재 위치와 3개월 학습 계획", type: "text", order: 25 },
  { section: "consult_page", key: "done_item_3", value: "수업·요금 안내와 첫 수업 환불 조건", type: "text", order: 26 },
  { section: "consult_page", key: "done_sub", value: "계정을 만들면 상담 진행 상황을 바로 확인할 수 있어요.", type: "text", order: 27 },
  { section: "consult_page", key: "done_btn_register", value: "1분 만에 계정 만들기", type: "text", order: 28 },
  { section: "consult_page", key: "done_btn_home", value: "홈으로", type: "text", order: 29 },
  { section: "consult_page", key: "kakao_hint", value: "양식 작성이 번거로우시면 카카오톡으로 편하게 문의하세요.", type: "text", order: 30 },
  { section: "consult_page", key: "kakao_button", value: "카카오톡으로 상담하기", type: "text", order: 31 },
];

/** 사이트 헤더 내비·버튼 라벨 기본값 */
export const siteHeaderDefaults = [
  { section: "site_header", key: "nav_pricing", value: "요금제", type: "text", order: 1 },
  { section: "site_header", key: "nav_tutors", value: "선생님", type: "text", order: 2 },
  { section: "site_header", key: "nav_reviews", value: "수강후기", type: "text", order: 3 },
  { section: "site_header", key: "nav_faq", value: "FAQ", type: "text", order: 4 },
  { section: "site_header", key: "nav_docs", value: "자료실", type: "text", order: 5 },
  { section: "site_header", key: "nav_compare", value: "비교하기", type: "text", order: 6 },
  { section: "site_header", key: "btn_login", value: "로그인", type: "text", order: 7 },
  { section: "site_header", key: "btn_logout", value: "로그아웃", type: "text", order: 8 },
  { section: "site_header", key: "btn_consult", value: "무료 상담", type: "text", order: 9 },
];

/** 상담 신청(가입) 모달 문구 기본값 */
export const signupModalDefaults = [
  { section: "signup_modal", key: "title", value: "상담 신청", type: "text", order: 1 },
  { section: "signup_modal", key: "subtext", value: "이름과 연락처만 남기면 매니저가 연락드립니다.", type: "text", order: 2 },
  { section: "signup_modal", key: "subtext_instant", value: "등록 후 담당 매니저가 배정되며, 방문 상담 가능 시간을 바로 입력할 수 있습니다.", type: "text", order: 3 },
  { section: "signup_modal", key: "label_name", value: "이름", type: "text", order: 4 },
  { section: "signup_modal", key: "label_phone", value: "전화번호", type: "text", order: 5 },
  { section: "signup_modal", key: "label_password", value: "비밀번호", type: "text", order: 6 },
  { section: "signup_modal", key: "label_password_confirm", value: "비밀번호 확인", type: "text", order: 7 },
  { section: "signup_modal", key: "guardian_consent_text", value: "만 14세 미만 학생은 법정대리인(보호자)의 동의가 필요합니다. 보호자로서 가입 및 개인정보 수집·이용에 동의합니다.", type: "text", order: 8 },
  { section: "signup_modal", key: "btn_submit", value: "상담 신청", type: "text", order: 9 },
  { section: "signup_modal", key: "btn_submit_instant", value: "등록하고 시작하기", type: "text", order: 10 },
  { section: "signup_modal", key: "btn_submitting", value: "처리 중…", type: "text", order: 11 },
  { section: "signup_modal", key: "step2_title", value: "상담 신청 완료", type: "text", order: 12 },
  { section: "signup_modal", key: "step2_subtext", value: "추가 정보를 남겨 주시면 매니저가 더 정확하게 준비해서 연락드려요. (선택사항)", type: "text", order: 13 },
  { section: "signup_modal", key: "step2_label_grade", value: "학년", type: "text", order: 14 },
  { section: "signup_modal", key: "step2_ph_grade", value: "학년 선택", type: "text", order: 15 },
  { section: "signup_modal", key: "step2_label_region", value: "거주 지역", type: "text", order: 16 },
  { section: "signup_modal", key: "step2_label_subjects", value: "희망 과목", type: "text", order: 17 },
  { section: "signup_modal", key: "step2_btn_save", value: "저장하고 계속", type: "text", order: 18 },
  { section: "signup_modal", key: "step2_btn_skip", value: "건너뛰기", type: "text", order: 19 },
  { section: "signup_modal", key: "login_hint", value: "이미 계정이 있으신가요?", type: "text", order: 20 },
  { section: "signup_modal", key: "login_link", value: "로그인", type: "text", order: 21 },
];

/** /reviews 섹션 보임/숨김 토글 기본값 */
export const reviewsSectionVisibilityDefaults = [
  { section: "reviews_page", key: "hall_section_visible", value: "1", type: "text", order: 300 },
  { section: "reviews_page", key: "success_section_visible", value: "1", type: "text", order: 301 },
  { section: "reviews_page", key: "band_section_visible", value: "1", type: "text", order: 302 },
  { section: "reviews_page", key: "proof_section_visible", value: "1", type: "text", order: 303 },
  { section: "reviews_page", key: "list_section_visible", value: "1", type: "text", order: 304 },
];

/** /tutors 섹션 보임/숨김 토글 기본값 */
export const tutorsSectionVisibilityDefaults = [
  { section: "tutors_featured", key: "news_section_visible", value: "1", type: "text", order: 300 },
  { section: "tutors_featured", key: "stats_section_visible", value: "1", type: "text", order: 301 },
  { section: "tutors_featured", key: "featured_section_visible", value: "1", type: "text", order: 302 },
  { section: "tutors_featured", key: "why_section_visible", value: "1", type: "text", order: 303 },
  { section: "tutors_featured", key: "proof_section_visible", value: "1", type: "text", order: 304 },
  { section: "tutors_featured", key: "rematch_section_visible", value: "1", type: "text", order: 305 },
  { section: "tutors_featured", key: "price_section_visible", value: "1", type: "text", order: 306 },
];
