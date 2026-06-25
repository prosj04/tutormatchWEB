/** 공개 페이지별 CMS 섹션 기본값 (seed + 관리자 UI 공용) */

import type { CSSProperties } from "react";
import { getEffectivePhotoUrl } from "@/lib/profile-gender";
import { PRICING_PLAN_SLOTS, formatPlanPrice } from "@/lib/pricing-plans";

export { getGenderDefaultPhotoUrl, getEffectivePhotoUrl } from "@/lib/profile-gender";

/** 홈·요금제 등 관리자에서 동일 박스 UI로 노출되는 카드 슬롯 수 */
export const CMS_MANAGED_CARD_SLOT_COUNT = 6;

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

function pricingBoxRowsForSlot(
  boxIndex: number,
  plan: (typeof PRICING_PLAN_SLOTS)[number],
  visibleDefault: string,
  orderStart: number,
  keyFn: typeof pricingBoxFieldKey = pricingBoxFieldKey,
) {
  const featuresText = plan.features.join("\n");
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
      value: plan.title,
      type: "text" as const,
      order: orderStart + 1,
    },
    {
      section: "pricing_page" as const,
      key: keyFn(boxIndex, "subtitle"),
      value: plan.subtitle,
      type: "text" as const,
      order: orderStart + 2,
    },
    {
      section: "pricing_page" as const,
      key: keyFn(boxIndex, "price"),
      value: formatPlanPrice(plan.sessions, plan.subjects),
      type: "text" as const,
      order: orderStart + 3,
    },
    {
      section: "pricing_page" as const,
      key: keyFn(boxIndex, "features"),
      value: featuresText,
      type: "text" as const,
      order: orderStart + 4,
    },
  ];
}

export const pricingPageDefaults = [
  { section: "pricing_page", key: "header_title", value: "1:1 맞춤 과외,\n월 40만원부터", type: "text", order: 1 },
  {
    section: "pricing_page",
    key: "header_subtext",
    value: "1과목·2과목(선생님 2명) 패키지를 선택하세요.",
    type: "text",
    order: 2,
  },
  ...pricingBoxRowsForSlot(1, PRICING_PLAN_SLOTS[0], "1", 3),
  ...pricingBoxRowsForSlot(2, PRICING_PLAN_SLOTS[1], "1", 8),
  ...pricingBoxRowsForSlot(3, PRICING_PLAN_SLOTS[2], "1", 13),
  ...pricingBoxRowsForSlot(4, PRICING_PLAN_SLOTS[3], "1", 18),
  ...pricingBoxRowsForSlot(5, PRICING_PLAN_SLOTS[4], "0", 23),
  ...pricingBoxRowsForSlot(6, PRICING_PLAN_SLOTS[5], "0", 28),

  /** 중등 카드 세트 — 비워 두면 고등과 동일 문구가 노출되도록 빌더에서 폴백 */
  ...pricingBoxRowsForSlot(1, PRICING_PLAN_SLOTS[0], "1", 130, pricingMiddleBoxFieldKey),
  ...pricingBoxRowsForSlot(2, PRICING_PLAN_SLOTS[1], "1", 135, pricingMiddleBoxFieldKey),
  ...pricingBoxRowsForSlot(3, PRICING_PLAN_SLOTS[2], "1", 140, pricingMiddleBoxFieldKey),
  ...pricingBoxRowsForSlot(4, PRICING_PLAN_SLOTS[3], "1", 145, pricingMiddleBoxFieldKey),
  ...pricingBoxRowsForSlot(5, PRICING_PLAN_SLOTS[4], "0", 150, pricingMiddleBoxFieldKey),
  ...pricingBoxRowsForSlot(6, PRICING_PLAN_SLOTS[5], "0", 155, pricingMiddleBoxFieldKey),

  /** 하위 호환: 구 plan id 키 + plan4_/plan8_ */
  ...PRICING_PLAN_SLOTS.slice(0, 4).flatMap((plan, idx) => {
    const orderStart = 90 + idx * 5;
    return [
      { section: "pricing_page", key: pricingPlanFieldKey(plan.id, "visible"), value: "1", type: "text" as const, order: orderStart },
      { section: "pricing_page", key: pricingPlanFieldKey(plan.id, "title"), value: plan.title, type: "text" as const, order: orderStart + 1 },
      {
        section: "pricing_page",
        key: pricingPlanFieldKey(plan.id, "subtitle"),
        value: plan.subtitle,
        type: "text",
        order: orderStart + 2,
      },
      {
        section: "pricing_page",
        key: pricingPlanFieldKey(plan.id, "price"),
        value: formatPlanPrice(plan.sessions, plan.subjects),
        type: "text",
        order: orderStart + 3,
      },
      {
        section: "pricing_page",
        key: pricingPlanFieldKey(plan.id, "features"),
        value: plan.features.join("\n"),
        type: "text",
        order: orderStart + 4,
      },
    ];
  }),
  { section: "pricing_page", key: "plan4_title", value: PRICING_PLAN_SLOTS[0].title, type: "text", order: 100 },
  { section: "pricing_page", key: "plan4_price", value: formatPlanPrice(4, 1), type: "text", order: 101 },
  { section: "pricing_page", key: "plan4_subtitle", value: PRICING_PLAN_SLOTS[0].subtitle, type: "text", order: 102 },
  {
    section: "pricing_page",
    key: "plan4_features",
    value: PRICING_PLAN_SLOTS[0].features.join("\n"),
    type: "text",
    order: 103,
  },
  { section: "pricing_page", key: "plan8_title", value: PRICING_PLAN_SLOTS[1].title, type: "text", order: 104 },
  { section: "pricing_page", key: "plan8_price", value: formatPlanPrice(8, 1), type: "text", order: 105 },
  { section: "pricing_page", key: "plan8_subtitle", value: PRICING_PLAN_SLOTS[1].subtitle, type: "text", order: 106 },
  {
    section: "pricing_page",
    key: "plan8_features",
    value: PRICING_PLAN_SLOTS[1].features.join("\n"),
    type: "text",
    order: 107,
  },
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
  { section: "home_labels", key: "section_title_reviews", value: "학습 후기", type: "text", order: 17 },
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
  { section: "home_page", key: "show_faq_section", value: "0", type: "text", order: 0 },
  { section: "home_page", key: "show_reviews_section", value: "1", type: "text", order: 1 },
  { section: "home_page", key: "pricing_kicker", value: "PRICE", type: "text", order: 2 },
  { section: "home_page", key: "pricing_title", value: "1:1 맞춤 과외,\n월 40만원부터", type: "text", order: 3 },
  {
    section: "home_page",
    key: "pricing_subtext",
    value: "1과목·2과목(선생님 2명) 패키지는 요금제 페이지에서 확인하세요.",
    type: "text",
    order: 4,
  },
  { section: "home_page", key: "pricing_cta", value: "요금제 더보기", type: "text", order: 5 },
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
