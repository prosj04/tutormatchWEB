"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { CmsCardBox, CmsCardBoxGrid } from "@/components/admin/CmsCardBox";
import { CmsVisibilityToggle } from "@/components/admin/CmsVisibilityToggle";
import { CmsPublicTeachersPanel } from "@/components/admin/CmsPublicTeachersPanel";
import {
  CMS_ALL_SPACING_SECTIONS,
  CMS_HOME_SPACING_SECTIONS,
  CMS_MANAGED_CARD_SLOT_COUNT,
  CMS_SPACING_DEFAULT_PX,
  CMS_TEXT_SIZE_OPTIONS,
  extraPublicPagesDefaults,
  FEATURED_TUTOR_CARD_COUNT,
  featuredTutorFieldKey,
  footerDefaults,
  getCmsTextStyleTarget,
  homeBenchmarkSectionsDefaults,
  homeLabelsDefaults,
  reviewsBenchmarkDefaults,
  tutorsFeaturedDefaults,
  portalPagesDefaults,
  portalPagesFieldLabels,
  pricingBoxFieldKey,
  pricingMiddleBoxFieldKey,
} from "@/lib/cms-page-defaults";
import { RESULT_CARD_IMAGES } from "@/lib/result-card-images";
import { COMPARE_ROW_COUNT } from "@/lib/compare-cms";
import { PRICING_PLANS_V2 } from "@/lib/pricing-plans";
import { REVIEW_CATEGORIES } from "@/lib/reviews-html-fallback";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type CmsContent = Record<string, Record<string, string>>;

type TestimonialRow = {
  id: string;
  title: string | null;
  quote: string;
  author: string;
  imageUrl: string | null;
  gradeFrom: string | null;
  gradeTo: string | null;
  category: string | null;
  tags: string | null;
  order: number;
  isActive: boolean;
  showOnHome: boolean;
  showOnReviewsPage: boolean;
};

const REVIEW_CATEGORY_OPTIONS = REVIEW_CATEGORIES;

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  showOnHome: boolean;
  showOnFaqPage: boolean;
};

type TextFieldConfig = {
  label: string;
  section: string;
  keyName: string;
  defaultValue: string;
  kind?: "input" | "textarea";
  rows?: number;
};

type ImageFieldConfig = {
  label: string;
  section: string;
  keyName: string;
  defaultValue: string;
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary";
const textareaClass = `${inputClass} resize-y`;

const heroFields: TextFieldConfig[] = [
  {
    label: "메인 헤드라인",
    section: "hero",
    keyName: "headline",
    defaultValue: "아이마다 맞는\n선생님이 다릅니다",
    kind: "textarea",
    rows: 2,
  },
  {
    label: "설명 문구",
    section: "hero",
    keyName: "subtext",
    defaultValue: "2학기를 뒤집는 여름방학, 잘 맞는 선생님에서 시작됩니다.",
    kind: "textarea",
    rows: 2,
  },
  { label: "주요 버튼", section: "hero", keyName: "cta_primary", defaultValue: "선생님 추천받기" },
  { label: "보조 버튼", section: "hero", keyName: "cta_secondary", defaultValue: "선생님 둘러보기" },
];

const resultDefaults = [
  { student: "고2 학생", before: "수학 5등급→", after: "2등급으로 상승", image: RESULT_CARD_IMAGES[0] },
  { student: "중3 학생", before: "영어 64점→", after: "87점으로 상승", image: RESULT_CARD_IMAGES[1] },
  { student: "고1 학생", before: "국어 55점→", after: "78점으로 상승", image: RESULT_CARD_IMAGES[2] },
  { student: "중2 학생", before: "수학 85점→", after: "100점으로 상승", image: RESULT_CARD_IMAGES[3] },
  { student: "고3 학생", before: "영어 5등급→", after: "3등급으로 상승", image: RESULT_CARD_IMAGES[4] },
  { student: "고1 학생", before: "수학 69점→", after: "92점으로 상승", image: RESULT_CARD_IMAGES[5] },
];


const stepDefaults = [
  {
    title: "무료 상담 신청",
    desc: "학생의 현재 성적, 목표, 성향을 간단히 남겨주세요.",
    image: "/images/photos/scenes/scene-1.jpg",
  },
  {
    title: "매니저 배정 및 전화 상담",
    desc: "10년 경력 매니저가 학습 상황과 가족의 우선순위를 듣습니다.",
    image: "/images/photos/scenes/scene-2.jpg",
  },
  {
    title: "선생님 추천 및 매칭",
    desc: "과목, 성향, 일정에 맞는 선생님 후보를 추천합니다.",
    image: "/images/photos/scenes/scene-3.jpg",
  },
  {
    title: "수업 시작",
    desc: "첫 수업 후 적합도를 확인하고 필요한 조정을 진행합니다.",
    image: "/images/photos/scenes/scene-4.jpg",
  },
  {
    title: "학습 리포트 & 관리",
    desc: "진도, 숙제, 질문, 리포트를 한 흐름으로 관리합니다.",
    image: "/images/photos/scenes/scene-5.jpg",
  },
  {
    title: "",
    desc: "",
    image: "/images/photos/scenes/scene-1.jpg",
  },
];

const managementHeaderFields: TextFieldConfig[] = [
  {
    label: "제목",
    section: "management",
    keyName: "headline",
    defaultValue: "수업 밖에서도\n이어지는 학습 관리",
    kind: "textarea",
    rows: 2,
  },
  {
    label: "설명",
    section: "management",
    keyName: "subtext",
    defaultValue: "진도, 숙제, 질문, 리포트를 한 화면에서 연결해 학생·선생님·매니저가 같은 목표를 봅니다.",
    kind: "textarea",
    rows: 2,
  },
];

/** 학습 관리 섹션 박스 1–6 제목·설명 (표시 여부는 CmsCardBox 체크박스) */
function managementSlotFields(boxIndex: number): TextFieldConfig[] {
  const defaults = [
    { title: "진도 관리", desc: "주간 진도와 목표 달성률을 매니저·가정과 공유합니다." },
    { title: "질문 관리", desc: "복습 질문에 대한 즉각 피드백으로 자기주도 학습을 돕습니다." },
    { title: "리포트", desc: "월간 학습 데이터와 취약 유형 분석을 리포트로 제공합니다." },
    { title: "", desc: "" },
    { title: "", desc: "" },
    { title: "", desc: "" },
  ];
  const d = defaults[boxIndex - 1] ?? { title: "", desc: "" };
  return [
    {
      label: "카드 제목",
      section: "management",
      keyName: `item${boxIndex}_title`,
      defaultValue: d.title,
    },
    {
      label: "카드 설명",
      section: "management",
      keyName: `item${boxIndex}_desc`,
      defaultValue: d.desc,
      kind: "textarea",
      rows: 2,
    },
  ];
}

const AUTOSAVE_DELAY_MS = 10_000;

const pricingHeaderFields: TextFieldConfig[] = [
  {
    label: "페이지 kicker",
    section: "pricing_page",
    keyName: "kicker",
    defaultValue: "Plans",
  },
  {
    label: "페이지 제목",
    section: "pricing_page",
    keyName: "header_title",
    defaultValue: "투명한 요금,\n꼭 맞는 1:1 과외",
    kind: "textarea",
    rows: 2,
  },
  {
    label: "페이지 설명",
    section: "pricing_page",
    keyName: "header_subtext",
    defaultValue:
      "모든 플랜에 학습 리포트·매니저 관리·강사 첨삭이 포함됩니다. 첫 배정 선생님이 맞지 않으면 추가 비용 없이 재매칭합니다.",
    kind: "textarea",
    rows: 3,
  },
];

const homePricingFields: TextFieldConfig[] = [
  { label: "홈 섹션 라벨", section: "home_labels", keyName: "kicker_plans", defaultValue: "PLANS" },
  {
    label: "홈 섹션 제목",
    section: "home_page",
    keyName: "plans_title",
    defaultValue: "가격까지 숨김없이 공개합니다",
    kind: "textarea",
    rows: 2,
  },
  {
    label: "홈 섹션 설명",
    section: "home_page",
    keyName: "plans_subtext",
    defaultValue: "학습 리포트·매니저 관리·강사 첨삭이 모든 플랜에 포함됩니다. 정확한 요금은 상담에서 아이에 맞춰 안내드립니다.",
    kind: "textarea",
    rows: 3,
  },
];

function pricingSlotInnerFields(
  boxIndex: number,
  keyFn: (index: number, field: Parameters<typeof pricingBoxFieldKey>[1]) => string = pricingBoxFieldKey,
): TextFieldConfig[] {
  // boxIndex is 1-based; slots 1–4 map to high-tier plans (w1h2, w1h3, w2h2, w2h3)
  const highPlans = PRICING_PLANS_V2.filter((p) => p.tier === "high");
  const plan = highPlans[boxIndex - 1];
  const defaultTitle = plan
    ? `주 ${plan.weekly}회 · 회당 ${plan.hoursPerLesson}시간`
    : `박스 ${boxIndex}`;
  const defaultSubtitle = plan ? `월 ${plan.monthlyHours}시간` : "";
  const defaultFeatures = plan
    ? [
        `${plan.weekly === 1 ? "주 1회" : "주 2회"} 수업 · 회당 ${plan.hoursPerLesson}시간`,
        "학습 진도 관리",
        "과제 관리",
        plan.weekly === 2 ? "AI 질답 횟수 2배 제공" : "AI 질답 이용 가능",
        "수시 강사 첨삭, 질답",
      ].join("\n")
    : "";
  return [
    {
      label: "제목",
      section: "pricing_page",
      keyName: keyFn(boxIndex, "title"),
      defaultValue: defaultTitle,
    },
    {
      label: "부제 (월 수업시간)",
      section: "pricing_page",
      keyName: keyFn(boxIndex, "subtitle"),
      defaultValue: defaultSubtitle,
    },
    {
      label: "혜택 (줄바꿈으로 구분)",
      section: "pricing_page",
      keyName: keyFn(boxIndex, "features"),
      defaultValue: defaultFeatures,
      kind: "textarea",
      rows: 6,
    },
  ];
}

function ctaBenefitSlotInnerFields(boxIndex: number): TextFieldConfig[] {
  const defaults: { title: string; desc: string; detail: string }[] = [
    {
      title: "무료 상담 1회",
      desc: "매니저가 직접 학생 상황을 파악합니다.",
      detail:
        "현재 성적·목표·일정을 함께 정리하고, 가장 현실적인 학습 방향을 제안해 드립니다.",
    },
    {
      title: "매니저 직접 배정",
      desc: "전문 매니저가 처음부터 함께합니다.",
      detail: "수업 외에도 진도·숙제·질문을 챙기며 학부모님께도 정기적으로 공유합니다.",
    },
    {
      title: "학습 리포트 무료",
      desc: "첫 달 학습 리포트를 무료로 제공합니다.",
      detail: "출결, 과제 수행률, 취약 단원을 한눈에 볼 수 있는 리포트를 받아보세요.",
    },
    {
      title: "맞춤 강사 매칭",
      desc: "성향과 목표에 맞는 선생님을 연결합니다.",
      detail: "무작위 배정이 아니라 상담 내용을 바탕으로 후보를 추천하고 일정까지 조율합니다.",
    },
    { title: "", desc: "", detail: "" },
    { title: "", desc: "", detail: "" },
  ];
  const d = defaults[boxIndex - 1] ?? { title: "", desc: "", detail: "" };
  return [
    {
      label: "카드 제목",
      section: "cta",
      keyName: `cta_box_${boxIndex}_title`,
      defaultValue: d.title,
    },
    {
      label: "카드 부제·강조",
      section: "cta",
      keyName: `cta_box_${boxIndex}_desc`,
      defaultValue: d.desc,
      kind: "textarea",
      rows: 2,
    },
    {
      label: "상세 안내",
      section: "cta",
      keyName: `cta_box_${boxIndex}_detail`,
      defaultValue: d.detail,
      kind: "textarea",
      rows: 3,
    },
  ];
}

const pricingFaqFields: TextFieldConfig[] = [
  { label: "FAQ 섹션 제목", section: "pricing_page", keyName: "faq_title", defaultValue: "자주 묻는 질문" },
  { label: "FAQ kicker", section: "pricing_page", keyName: "faq_kicker", defaultValue: "FAQ" },
  {
    label: "FAQ 1 질문",
    section: "pricing_page",
    keyName: "faq1_q",
    defaultValue: "수업 시간과 환불 규정은 어떻게 되나요?",
    kind: "textarea",
    rows: 2,
  },
  {
    label: "FAQ 1 답변",
    section: "pricing_page",
    keyName: "faq1_a",
    defaultValue:
      "1회 수업은 50분 기준이며, 개강 전 결제 취소는 전액 환불됩니다. 개강 후에는 잔여 횟수에 비례하여 산정되며, 세부 약관은 계약서에 명시됩니다.",
    kind: "textarea",
    rows: 3,
  },
  {
    label: "FAQ 2 질문",
    section: "pricing_page",
    keyName: "faq2_q",
    defaultValue: "강사 변경이 가능한가요?",
    kind: "textarea",
    rows: 2,
  },
  {
    label: "FAQ 2 답변",
    section: "pricing_page",
    keyName: "faq2_a",
    defaultValue:
      "첫 2회 수업 이내에만 동일 요금제 범위에서 1회에 한해 변경이 가능합니다. 이후에는 매니저와 별도 협의가 필요합니다.",
    kind: "textarea",
    rows: 3,
  },
  {
    label: "FAQ 3 질문",
    section: "pricing_page",
    keyName: "faq3_q",
    defaultValue: "AI 질답은 어떻게 이용하나요?",
    kind: "textarea",
    rows: 2,
  },
  {
    label: "FAQ 3 답변",
    section: "pricing_page",
    keyName: "faq3_a",
    defaultValue:
      "가입 시 발급되는 학습 계정으로 24시간 질문이 가능하며, 강사 첨삭 횟수는 선택하신 플랜에 따라 월 4회 또는 무제한 혜택이 적용됩니다.",
    kind: "textarea",
    rows: 3,
  },
  {
    label: "FAQ 4 질문",
    section: "pricing_page",
    keyName: "faq4_q",
    defaultValue: "결제 수단은 무엇이 있나요?",
    kind: "textarea",
    rows: 2,
  },
  {
    label: "FAQ 4 답변",
    section: "pricing_page",
    keyName: "faq4_a",
    defaultValue:
      "체크아웃 페이지에서 카드, 간편결제 등 토스페이먼츠에서 제공하는 수단을 선택하실 수 있습니다.",
    kind: "textarea",
    rows: 3,
  },
];

const tutorsPageFields: TextFieldConfig[] = [
  { label: "페이지 제목", section: "tutors_page", keyName: "header_title", defaultValue: "강사진" },
  {
    label: "페이지 설명",
    section: "tutors_page",
    keyName: "header_subtext",
    defaultValue:
      "관리자 승인이 완료된 선생님을 확인할 수 있습니다. 카드 내용은 관리자 페이지에서 수정한 정보가 바로 반영됩니다.",
    kind: "textarea",
    rows: 3,
  },
  {
    label: "빈 목록 제목",
    section: "tutors_page",
    keyName: "empty_title",
    defaultValue: "등록된 강사진이 없습니다.",
  },
  {
    label: "빈 목록 설명",
    section: "tutors_page",
    keyName: "empty_desc",
    defaultValue: "승인된 선생님이 생기면 이곳에 표시됩니다.",
    kind: "textarea",
    rows: 2,
  },
];

const EXTRA_PAGE_LABELS: Record<string, Record<string, string>> = {
  faq_page: {
    kicker: "꼬리글",
    title: "제목",
    subtext: "설명",
    empty_text: "FAQ 없을 때 안내",
  },
  reviews_page: {
    kicker: "꼬리글",
    title: "제목",
    subtext: "설명",
    empty_text: "후기 없을 때 안내",
  },
  login_page: {
    kicker: "꼬리글",
    title: "제목",
    subtext: "설명",
    signup_prompt: "회원가입 유도 (버튼 앞)",
    signup_cta: "상담 신청 버튼",
  },
  checkout_page: {
    header_kicker: "상단 꼬리글",
    header_title: "페이지 제목",
    link_pricing: "요금제 링크",
    link_consultation: "상담 링크",
    section_order_title: "주문 요약 제목",
    dt_plan: "플랜 항목",
    dt_subjects: "과목 수 항목",
    dt_tutor: "강사 항목",
    dt_platform: "플랫폼 이용료",
    dt_lesson: "수업료",
    dt_total: "총 결제금액",
    section_payment_title: "결제 수단 제목",
    payment_note: "결제 수단 안내",
    section_customer_title: "주문자 정보 제목",
    label_name: "이름 라벨",
    label_phone: "연락처 라벨",
    label_email: "이메일 라벨",
    terms_text: "약관 동의 문구",
    pay_button: "결제 버튼",
    paying_label: "결제 중 표시",
    widget_loading: "위젯 로딩 문구",
    fail_banner: "결제 실패 배너",
  },
  success_page: {
    kicker: "꼬리글",
    title: "제목",
    body: "본문",
    label_order: "주문번호 라벨",
    label_payment_key: "결제키 라벨",
    label_amount: "승인 금액 라벨",
    missing_payment_info: "결제 정보 없을 때",
    link_home: "홈 버튼",
    link_consultation: "상담 버튼",
  },
};

const CMS_VISIBILITY_FIELD_KEYS = new Set(["show_page", "show_faq_section", "show_reviews_section"]);

function buildExtraFields(section: string): TextFieldConfig[] {
  return extraPublicPagesDefaults
    .filter((row) => row.section === section && !CMS_VISIBILITY_FIELD_KEYS.has(row.key))
    .map((row) => {
      const long = row.value.includes("\n") || row.value.length > 100;
      return {
        label: EXTRA_PAGE_LABELS[section]?.[row.key] ?? row.key,
        section: row.section,
        keyName: row.key,
        defaultValue: row.value,
        ...(long ? { kind: "textarea" as const, rows: 3 } : {}),
      };
    });
}

type CmsDefaultRow = { section: string; key: string; value: string; type: string; order?: number };

const BENCHMARK_FIELD_LABELS: Record<string, Record<string, string>> = {
  reviews_page: {
    hero_kicker: "히어로 kicker",
    hero_title: "히어로 제목",
    hero_subtext: "히어로 설명",
    band_title: "통계 밴드 제목",
    band_stat1_number: "통계 1 숫자",
    band_stat1_label: "통계 1 라벨",
    band_stat2_number: "통계 2 숫자",
    band_stat2_label: "통계 2 라벨",
    band_footnote: "통계 밴드 각주",
    list_title: "후기 목록 제목",
    list_subtext: "후기 목록 설명",
    cta_title: "하단 CTA 제목",
    cta_subtext: "하단 CTA 설명",
  },
  reviews_success: {
    section_title: "섹션 제목",
    section_footnote: "섹션 각주",
  },
  reviews_proof: {
    section_title: "섹션 제목",
    section_footnote: "섹션 각주",
  },
  home_problem: {
    headline: "문제 제기 헤드라인",
    subtext: "문제 제기 설명",
  },
  tutors_featured: {
    home_title: "홈 선생님 섹션 제목",
    home_subtext: "홈 선생님 섹션 설명",
  },
};

function benchmarkKeyLabel(section: string, key: string): string {
  const direct = BENCHMARK_FIELD_LABELS[section]?.[key];
  if (direct) return direct;
  const successCard = key.match(/^card(\d+)_(from|to|result|student|tags|visible)$/);
  if (successCard) {
    const suffix: Record<string, string> = {
      from: "변화 전",
      to: "변화 후",
      result: "결과 설명",
      student: "학생 표기",
      tags: "태그(줄바꿈)",
      visible: "노출",
    };
    return `사례 ${successCard[1]} · ${suffix[successCard[2]!] ?? successCard[2]}`;
  }
  const proofCard = key.match(/^proof(\d+)_(image|student|comment|visible)$/);
  if (proofCard) {
    const suffix: Record<string, string> = {
      image: "이미지",
      student: "학생 표기",
      comment: "코멘트",
      visible: "노출",
    };
    return `인증 ${proofCard[1]} · ${suffix[proofCard[2]!] ?? proofCard[2]}`;
  }
  return key;
}

function buildFieldsFromDefaults(
  defaults: readonly CmsDefaultRow[],
  section: string,
): TextFieldConfig[] {
  return defaults
    .filter((row) => row.section === section && row.type !== "image")
    .map((row) => {
      const long = row.value.includes("\n") || row.value.length > 60;
      return {
        label: benchmarkKeyLabel(section, row.key),
        section: row.section,
        keyName: row.key,
        defaultValue: row.value,
        ...(long ? { kind: "textarea" as const, rows: 3 } : {}),
      };
    });
}

function buildImageFieldsFromDefaults(
  defaults: readonly CmsDefaultRow[],
  section: string,
): ImageFieldConfig[] {
  return defaults
    .filter((row) => row.section === section && row.type === "image")
    .map((row) => ({
      label: benchmarkKeyLabel(section, row.key),
      section: row.section,
      keyName: row.key,
      defaultValue: row.value,
    }));
}

function buildPortalFields(section: string): TextFieldConfig[] {
  return portalPagesDefaults
    .filter((row) => row.section === section && row.type === "text")
    .map((row) => {
      const long = row.value.includes("\n") || row.value.length > 100;
      return {
        label: portalPagesFieldLabels[section]?.[row.key] ?? row.key,
        section: row.section,
        keyName: row.key,
        defaultValue: row.value,
        ...(long ? { kind: "textarea" as const, rows: 3 } : {}),
      };
    });
}

const PORTAL_STUDENT_SUBSECTIONS: { section: string; title: string }[] = [
  { section: "student_dashboard", title: "상단 바 · 플래너" },
  { section: "student_copy_plan", title: "이전 날짜 복사 모달" },
  { section: "student_questions", title: "질문 섹션" },
  { section: "student_question_modal", title: "질문 등록 모달" },
  { section: "student_task_list", title: "할 일 목록" },
];

const CMS_PAGES = [
  { id: "home", label: "홈", previewHref: "/" },
  { id: "pricing", label: "요금제", previewHref: "/pricing" },
  { id: "tutors", label: "강사진", previewHref: "/tutors" },
  { id: "faq", label: "FAQ", previewHref: "/faq" },
  { id: "reviews", label: "학습 후기", previewHref: "/reviews" },
  { id: "login", label: "로그인", previewHref: "/login" },
  { id: "commerce", label: "결제·완료", previewHref: "/checkout" },
  { id: "portal_student", label: "학생 포털", previewHref: "/dashboard" },
  { id: "portal_teacher", label: "선생님·매니저", previewHref: "/teacher-portal/dashboard" },
] as const;

type CmsPageId = (typeof CMS_PAGES)[number]["id"];

type SelectedField = { section: string; key: string };

function resolveSpacingSectionKey(section: string, key: string): string | null {
  const wholeSection = CMS_HOME_SPACING_SECTIONS.find((item) => item.key === section && key === section);
  if (wholeSection) return wholeSection.key;
  if (section === "spacing") {
    const match = key.match(/^(.+)_(pt|pb|px)$/);
    if (match) return match[1]!;
  }
  return null;
}

function isImageFieldKey(key: string): boolean {
  return /image|url/i.test(key);
}

function getIframeSrc(pageId: CmsPageId): string {
  const href = CMS_PAGES.find((page) => page.id === pageId)?.previewHref ?? "/";
  return `${href}?cms_edit=1`;
}

const ctaFields: TextFieldConfig[] = [
  {
    label: "하단 CTA 제목",
    section: "cta",
    keyName: "headline",
    defaultValue: "지금 신청하면 받을 수 있는 혜택이에요",
    kind: "textarea",
    rows: 2,
  },
  {
    label: "하단 CTA 설명",
    section: "cta",
    keyName: "subtext",
    defaultValue: "무료 상담 1회 · 매니저 직접 배정 · 학습 리포트 무료 제공",
    kind: "textarea",
    rows: 2,
  },
  { label: "하단 CTA 버튼", section: "cta", keyName: "button", defaultValue: "무료 상담 신청하기" },
];

const FOOTER_FIELD_LABELS: Record<string, string> = {
  cta_title: "CTA 제목",
  hours_chat: "채팅 문의 시간",
  hours_call: "전화 문의 시간",
  btn_chat: "채팅 문의 버튼",
  btn_phone: "전화 문의 버튼",
  phone_number: "전화번호",
  sns_instagram: "Instagram URL",
  sns_youtube: "YouTube URL",
  sns_blog: "Blog URL",
  company_name: "상호",
  company_rep: "대표자명",
  company_reg: "사업자등록번호",
  company_address: "주소",
  copyright: "저작권 문구 ({year} 치환)",
  label_terms: "이용약관 라벨",
  label_privacy: "개인정보처리방침 라벨",
  label_refund: "환불정책 라벨",
  label_service: "서비스 섹션 라벨",
  label_sns: "SNS 섹션 라벨",
  label_teacher: "선생님 포털 링크",
};

const HOME_LABELS_FIELD_LABELS: Record<string, string> = {
  nav_tab_1: "탭 1 (서비스 소개)",
  nav_tab_2: "탭 2 (선생님)",
  nav_tab_3: "탭 3 (학습 관리)",
  nav_tab_4: "탭 4 (진행 방식)",
  nav_tab_5: "탭 5 (요금제)",
  nav_tab_6: "탭 6 (서비스 비교)",
  kicker_results: "RESULTS kicker",
  kicker_teachers: "TEACHERS kicker",
  kicker_reviews: "REVIEWS kicker",
  kicker_management: "LEARNING CARE kicker",
  kicker_process: "PROCESS kicker",
  kicker_plans: "PLANS kicker",
  section_title_faq: "FAQ 섹션 제목",
  section_title_reviews: "후기 섹션 제목",
};

function fieldsFromDefaults(
  defaults: readonly { section: string; key: string; value: string }[],
  labels: Record<string, string>,
): TextFieldConfig[] {
  return defaults.map((row) => ({
    label: labels[row.key] ?? row.key,
    section: row.section,
    keyName: row.key,
    defaultValue: row.value,
    kind: row.value.includes("\n") || row.value.length > 72 ? ("textarea" as const) : ("input" as const),
    rows: row.value.length > 72 ? 2 : undefined,
  }));
}

const footerFields = fieldsFromDefaults(footerDefaults, FOOTER_FIELD_LABELS);
const homeLabelsFields = fieldsFromDefaults(homeLabelsDefaults, HOME_LABELS_FIELD_LABELS);

const compareKickerField: TextFieldConfig = {
  label: "섹션 kicker",
  section: "compare",
  keyName: "kicker",
  defaultValue: "COMPARE",
};

const compareTableTitleField: TextFieldConfig = {
  label: "테이블 제목",
  section: "compare",
  keyName: "table_title",
  defaultValue: "서비스 비교",
};

const compareRowDefaults = [
  { feature: "선생님 자격 검증", concord: "✓ 서류·면접", other: "✗" },
  { feature: "선생님 실력 확인", concord: "✓ 사전 검증", other: "수업 후에야 파악" },
  { feature: "학생 맞춤 매칭", concord: "✓ 매니저가 성향·과목 맞춰 연결", other: "직접 알아봐야 함" },
  { feature: "선생님 교체 리스크", concord: "✓ 처음부터 핏 맞는 선생님", other: "맞지 않으면 1~2달 낭비" },
  { feature: "학생 관리", concord: "✓ 관리 매뉴얼 기반", other: "선생님 개인 역량 의존" },
  { feature: "매일 학습 점검", concord: "✓ 일별 플랜", other: "✗" },
  { feature: "질문 답변", concord: "✓ 상시 (강사·AI)", other: "수업 시간에만" },
  { feature: "문제 발생 대응", concord: "✓ 전담 매니저 조율", other: "학부모가 직접 해결" },
  { feature: "학습 기록 공유", concord: "✓ 플랜·기록 공유", other: "✗" },
];

function compareRowInnerFields(boxIndex: number): TextFieldConfig[] {
  const defaults = compareRowDefaults[boxIndex - 1]!;
  return [
    {
      label: "항목명",
      section: "compare",
      keyName: `row${boxIndex}_feature`,
      defaultValue: defaults.feature,
    },
    {
      label: "Concord",
      section: "compare",
      keyName: `row${boxIndex}_concord`,
      defaultValue: defaults.concord,
    },
    {
      label: "일반 과외",
      section: "compare",
      keyName: `row${boxIndex}_other`,
      defaultValue: defaults.other,
    },
  ];
}

function findTextFieldConfig(section: string, keyName: string): TextFieldConfig | undefined {
  const staticFields: TextFieldConfig[] = [
    ...heroFields,
    ...managementHeaderFields,
    ...pricingHeaderFields,
    ...homePricingFields,
    ...pricingFaqFields,
    ...tutorsPageFields,
    ...ctaFields,
    ...footerFields,
    ...homeLabelsFields,
    compareKickerField,
    compareTableTitleField,
    ...buildExtraFields("faq_page"),
    ...buildExtraFields("reviews_page"),
    ...buildExtraFields("login_page"),
    ...buildExtraFields("checkout_page"),
    ...buildExtraFields("success_page"),
    ...PORTAL_STUDENT_SUBSECTIONS.flatMap((item) => buildPortalFields(item.section)),
    ...buildPortalFields("student_consultation"),
    ...buildPortalFields("visit_picker"),
    ...buildPortalFields("teacher_portal"),
  ];
  return staticFields.find((field) => field.section === section && field.keyName === keyName);
}

export function AdminCmsPage() {
  const sensors = useSensors(useSensor(PointerSensor));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activePage, setActivePage] = useState<CmsPageId>("home");
  const [selectedField, setSelectedField] = useState<SelectedField | null>(null);
  const [content, setContent] = useState<CmsContent>({});
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const iframeSrc = getIframeSrc(activePage);

  const hasNoContent =
    !loading &&
    Object.keys(content).length === 0 &&
    testimonials.length === 0 &&
    faqs.length === 0;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [contentRes, testimonialRes, faqRes] = await Promise.all([
        fetch("/api/admin/cms/content"),
        fetch("/api/admin/cms/testimonials"),
        fetch("/api/admin/cms/faq"),
      ]);

      if (contentRes.ok) setContent((await contentRes.json()) as CmsContent);
      if (testimonialRes.ok) {
        const rows = (await testimonialRes.json()) as TestimonialRow[];
        setTestimonials(
          rows.map((item) => ({
            ...item,
            showOnHome: item.showOnHome ?? false,
            showOnReviewsPage: item.showOnReviewsPage ?? true,
          })),
        );
      }
      if (faqRes.ok) {
        const rows = (await faqRes.json()) as FaqRow[];
        setFaqs(
          rows.map((item) => ({
            ...item,
            showOnHome: item.showOnHome ?? false,
            showOnFaqPage: item.showOnFaqPage ?? true,
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSelectedField(null);
  }, [activePage]);

  useEffect(() => {
    function handler(event: MessageEvent) {
      if (event.data?.type === "cms_select") {
        setSelectedField({ section: event.data.section, key: event.data.key });
      }
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const reloadIframe = useCallback(() => {
    iframeRef.current?.contentWindow?.location.reload();
  }, []);

  const getValue = (section: string, keyName: string, defaultValue: string) =>
    content[section]?.[keyName] ?? defaultValue;

  async function patchContent(section: string, key: string, value: string) {
    const res = await fetch("/api/admin/cms/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, key, value }),
    });
    if (!res.ok) throw new Error("Content save failed");
    setContent((current) => ({
      ...current,
      [section]: { ...(current[section] ?? {}), [key]: value },
    }));
  }

  async function saveContent(section: string, key: string, value: string) {
    await patchContent(section, key, value);
    reloadIframe();
  }

  async function initDefaults() {
    const res = await fetch("/api/admin/cms/init", { method: "POST" });
    if (res.ok) await load();
  }

  async function upsertMarketingCopy() {
    const res = await fetch("/api/admin/cms/init?force=true", { method: "POST" });
    if (res.ok) await load();
  }

  async function patchTestimonial(id: string, payload: Partial<TestimonialRow>) {
    const res = await fetch(`/api/admin/cms/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Testimonial save failed");
    setTestimonials((current) =>
      current.map((item) => (item.id === id ? { ...item, ...payload } : item)),
    );
  }

  async function patchFaq(id: string, payload: Partial<FaqRow>) {
    const res = await fetch(`/api/admin/cms/faq/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("FAQ save failed");
    setFaqs((current) => current.map((item) => (item.id === id ? { ...item, ...payload } : item)));
  }

  async function addTestimonial() {
    const res = await fetch("/api/admin/cms/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quote: "새 후기를 입력하세요.",
        author: "학년 · 과목 · 작성자",
        imageUrl: "/images/photos/scenes/scene-6.jpg",
      }),
    });
    if (res.ok) await load();
  }

  async function addFaq() {
    const res = await fetch("/api/admin/cms/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "새 질문을 입력하세요.", answer: "답변을 입력하세요." }),
    });
    if (res.ok) await load();
  }

  async function deleteTestimonial(id: string) {
    if (!confirm("후기를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/cms/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  async function deleteFaq(id: string) {
    if (!confirm("FAQ를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/cms/faq/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  async function reorderTestimonials(activeId: string, overId: string) {
    const oldIndex = testimonials.findIndex((item) => item.id === activeId);
    const newIndex = testimonials.findIndex((item) => item.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(testimonials, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order: index + 1,
    }));
    setTestimonials(next);
    await Promise.all(next.map((item) => patchTestimonial(item.id, { order: item.order })));
  }

  async function reorderFaqs(activeId: string, overId: string) {
    const oldIndex = faqs.findIndex((item) => item.id === activeId);
    const newIndex = faqs.findIndex((item) => item.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(faqs, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order: index + 1,
    }));
    setFaqs(next);
    await Promise.all(next.map((item) => patchFaq(item.id, { order: item.order })));
  }

  function handleTestimonialDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    void reorderTestimonials(String(event.active.id), String(event.over.id));
  }

  function handleFaqDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    void reorderFaqs(String(event.active.id), String(event.over.id));
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="shrink-0">
        <h2 className="text-2xl font-black text-text-primary">사이트 콘텐츠 관리</h2>

        <div className="mt-6 flex items-end justify-between gap-2 border-b border-gray-200 pb-1">
          <div className="flex flex-wrap gap-2">
            {CMS_PAGES.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setActivePage(page.id)}
                className={`border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                  activePage === page.id
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-text-secondary"
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>
          <div className="mb-1 flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => void upsertMarketingCopy()}
              className="rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              마케팅 문구 업데이트
            </button>
            <button
              type="button"
              onClick={() => void initDefaults()}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-text-secondary"
            >
              기본값으로 초기화
            </button>
          </div>
        </div>

        {hasNoContent ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-bold text-amber-950">기본 콘텐츠가 없습니다.</p>
            <p className="mt-1 text-sm text-amber-900">기본값으로 초기화하면 현재 홈페이지 문구와 사진으로 시작합니다.</p>
          </div>
        ) : null}
      </div>

      {/* 좌: 미리보기 / 우: 편집 패널 */}
      <div
        className="mt-4 grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(400px,560px)]"
        style={{ height: "calc(100vh - 230px)", minHeight: "560px" }}
      >
        <div className="min-h-[320px] border-b border-gray-200 bg-neutral-10 lg:min-h-0 lg:border-b-0 lg:border-r">
          <iframe
            ref={iframeRef}
            key={activePage}
            title={`${CMS_PAGES.find((page) => page.id === activePage)?.label ?? "페이지"} 미리보기`}
            src={iframeSrc}
            className="h-full w-full border-0 bg-white"
          />
        </div>

        <div className="min-h-0 overflow-y-auto bg-background p-4">
          {loading ? (
            <p className="text-sm text-text-secondary">불러오는 중...</p>
          ) : selectedField ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setSelectedField(null)}
                className="text-sm font-bold text-primary hover:underline"
              >
                ← 전체 보기
              </button>
              <SelectedFieldEditor
                field={selectedField}
                getValue={getValue}
                onSave={saveContent}
              />
            </div>
          ) : (
            <div className="space-y-8">
          {activePage === "home" ? (
            <>
          <EditorSection eyebrow="HERO" title="첫 화면">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-4">
                {heroFields.map((field) => (
                  <AdminTextField
                    key={`${field.section}-${field.keyName}`}
                    field={field}
                    value={getValue(field.section, field.keyName, field.defaultValue)}
                    getValue={getValue}
                    onSave={saveContent}
                  />
                ))}
              </div>
              <div className="grid gap-4">
                <ImageField
                  field={{ label: "히어로 우측 사진 (단일)", section: "hero", keyName: "model_image", defaultValue: "/images/placeholders/hero-thumbnail.png" }}
                  value={getValue("hero", "model_image", "/images/placeholders/hero-thumbnail.png")}
                  onSave={saveContent}
                />
                <ImageField
                  field={{ label: "히어로 배경 이미지", section: "hero", keyName: "bg_image_url", defaultValue: "" }}
                  value={getValue("hero", "bg_image_url", "")}
                  onSave={saveContent}
                />
              </div>
            </div>
          </EditorSection>

          <EditorSection eyebrow="PROBLEM" title="문제 제기 섹션">
            <div className="grid gap-4 lg:grid-cols-2">
              {buildFieldsFromDefaults(
                [
                  { section: "home_problem", key: "headline", value: "선생님을 잘못 만나면\n1~2달을 잃습니다", type: "text" },
                  {
                    section: "home_problem",
                    key: "subtext",
                    value:
                      "핏이 맞지 않는 수업은 성적보다 시간을 먼저 갉아먹습니다. Concord는 처음부터 학생에게 맞는 선생님을 찾는 데 집중합니다.",
                    type: "text",
                  },
                ],
                "home_problem",
              ).map((field) => (
                <ContentField
                  key={`${field.section}-${field.keyName}`}
                  field={field}
                  value={getValue(field.section, field.keyName, field.defaultValue)}
                  onSave={saveContent}
                />
              ))}
            </div>
          </EditorSection>

          <EditorSection eyebrow="SPACING" title="섹션 여백">
            <p className="mb-5 text-sm text-text-secondary">
              각 섹션의 상·하·좌우 여백(px)입니다. 값을 비우면 기존 Tailwind 여백이 적용됩니다.
            </p>
            <div className="space-y-4">
              {CMS_ALL_SPACING_SECTIONS.map((item) => (
                <CmsSpacingSectionRow
                  key={item.key}
                  sectionKey={item.key}
                  label={item.label}
                  getValue={getValue}
                  onSave={saveContent}
                />
              ))}
            </div>
          </EditorSection>

          <EditorSection eyebrow="RESULTS" title="결과 카드">
            <div className="grid gap-4">
              <ContentField
                field={{
                  label: "섹션 제목",
                  section: "results",
                  keyName: "section_title",
                  defaultValue: "결과로 증명합니다",
                }}
                value={getValue("results", "section_title", "결과로 증명합니다")}
                onSave={saveContent}
              />
              <ContentField
                field={{
                  label: "기준 각주",
                  section: "results",
                  keyName: "section_note",
                  defaultValue: "2026년 상반기 Concord 수강생 기준",
                }}
                value={getValue("results", "section_note", "2026년 상반기 Concord 수강생 기준")}
                onSave={saveContent}
              />
              <CmsCardBoxGrid>
                {resultDefaults.map((result, index) => {
                  const number = index + 1;
                  const fields: TextFieldConfig[] = [
                    {
                      label: "학생",
                      section: "results",
                      keyName: `result${number}_student`,
                      defaultValue: result.student,
                    },
                    {
                      label: "이전",
                      section: "results",
                      keyName: `result${number}_before`,
                      defaultValue: result.before,
                    },
                    {
                      label: "결과",
                      section: "results",
                      keyName: `result${number}_after`,
                      defaultValue: result.after,
                    },
                  ];
                  return (
                    <CmsCardBox
                      key={number}
                      label={`결과 카드 박스 ${number}`}
                      section="results"
                      visibilityKey={`result${number}_visible`}
                      getValue={getValue}
                      onToggleVisible={saveContent}
                    >
                      <ImageField
                        field={{
                          label: "카드 하단 이미지",
                          section: "results",
                          keyName: `result${number}_image`,
                          defaultValue: result.image,
                        }}
                        value={getValue("results", `result${number}_image`, result.image)}
                        onSave={saveContent}
                      />
                      <div className="space-y-3">
                        {fields.map((field) => (
                          <ContentField
                            key={field.keyName}
                            field={field}
                            value={getValue(field.section, field.keyName, field.defaultValue)}
                            onSave={saveContent}
                          />
                        ))}
                      </div>
                    </CmsCardBox>
                  );
                })}
              </CmsCardBoxGrid>
            </div>
          </EditorSection>

          <EditorSection eyebrow="TEACHERS" title="검증 선생님 카드">
            <p className="mb-4 text-sm text-text-secondary">
              홈·강사진 페이지에 공통으로 노출되는 큐레이션 카드입니다. 총 {FEATURED_TUTOR_CARD_COUNT}장 중 체크된 카드만 노출되며, 홈에는 앞에서부터 3장이 표시됩니다.
            </p>
            <div className="grid gap-4">
              {buildFieldsFromDefaults(homeBenchmarkSectionsDefaults, "tutors_featured").map((field) => (
                <ContentField
                  key={`${field.section}-${field.keyName}`}
                  field={field}
                  value={getValue(field.section, field.keyName, field.defaultValue)}
                  onSave={saveContent}
                />
              ))}
              <CmsCardBoxGrid>
                {Array.from({ length: FEATURED_TUTOR_CARD_COUNT }, (_, index) => (
                  <FeaturedTutorCardEditor
                    key={index}
                    index={index}
                    getValue={getValue}
                    onSave={saveContent}
                  />
                ))}
              </CmsCardBoxGrid>
            </div>
          </EditorSection>

          <EditorSection eyebrow="LEARNING CARE" title="학습 관리">
            <div className="grid gap-4 lg:grid-cols-2">
              {managementHeaderFields.map((field) => (
                <AdminTextField
                  key={`${field.section}-${field.keyName}`}
                  field={field}
                  value={getValue(field.section, field.keyName, field.defaultValue)}
                  getValue={getValue}
                  onSave={saveContent}
                />
              ))}
            </div>
            <div className="mt-6">
              <CmsCardBoxGrid>
                {Array.from({ length: CMS_MANAGED_CARD_SLOT_COUNT }, (_, idx) => idx + 1).map((slot) => (
                  <CmsCardBox
                    key={slot}
                    label={`학습 관리 카드 박스 ${slot}`}
                    section="management"
                    visibilityKey={`item${slot}_visible`}
                    visibilityDefault={slot <= 3 ? "1" : "0"}
                    getValue={getValue}
                    onToggleVisible={saveContent}
                  >
                    {managementSlotFields(slot).map((field) => (
                      <ContentField
                        key={`${field.section}-${field.keyName}`}
                        field={field}
                        value={getValue(field.section, field.keyName, field.defaultValue)}
                        onSave={saveContent}
                      />
                    ))}
                  </CmsCardBox>
                ))}
              </CmsCardBoxGrid>
            </div>
          </EditorSection>

          <EditorSection eyebrow="PROCESS" title="진행 방식">
            <div className="grid gap-4 lg:grid-cols-2">
              <ContentField
                field={{
                  label: "섹션 제목",
                  section: "features",
                  keyName: "section_title",
                  defaultValue: "이렇게 진행됩니다",
                }}
                value={getValue("features", "section_title", "이렇게 진행됩니다")}
                onSave={saveContent}
              />
              <ContentField
                field={{
                  label: "섹션 설명",
                  section: "features",
                  keyName: "section_subtext",
                  defaultValue: "상담부터 매칭, 방문 수업까지 전담 매니저가 처음부터 끝까지 책임집니다.",
                  kind: "textarea",
                  rows: 2,
                }}
                value={getValue("features", "section_subtext", "상담부터 매칭, 방문 수업까지 전담 매니저가 처음부터 끝까지 책임집니다.")}
                onSave={saveContent}
              />
            </div>
            <div className="mt-6">
              <CmsCardBoxGrid>
                {stepDefaults.map((step, index) => (
                  <StepEditor key={index} index={index} defaults={step} getValue={getValue} onSave={saveContent} />
                ))}
              </CmsCardBoxGrid>
            </div>
          </EditorSection>

          <EditorSection eyebrow="CTA" title="혜택 안내">
            <div className="grid gap-4 lg:grid-cols-2">
              {ctaFields.map((field) => (
                <AdminTextField
                  key={`${field.section}-${field.keyName}`}
                  field={field}
                  value={getValue(field.section, field.keyName, field.defaultValue)}
                  getValue={getValue}
                  onSave={saveContent}
                />
              ))}
            </div>
            <div className="mt-6">
              <p className="mb-4 text-sm text-text-secondary">
                네온 카드 형태 혜택 박스입니다. 필요하면 박스 5~6을 켠 뒤 제목부터 채우면 홈에 반영됩니다.
              </p>
              <CmsCardBoxGrid>
                {Array.from({ length: CMS_MANAGED_CARD_SLOT_COUNT }, (_, idx) => idx + 1).map((slot) => (
                  <CmsCardBox
                    key={slot}
                    label={`혜택 카드 박스 ${slot}`}
                    section="cta"
                    visibilityKey={`cta_box_${slot}_visible`}
                    visibilityDefault={slot <= 4 ? "1" : "0"}
                    getValue={getValue}
                    onToggleVisible={saveContent}
                  >
                    {ctaBenefitSlotInnerFields(slot).map((field) => (
                      <ContentField
                        key={`${field.section}-${field.keyName}`}
                        field={field}
                        value={getValue(field.section, field.keyName, field.defaultValue)}
                        onSave={saveContent}
                      />
                    ))}
                  </CmsCardBox>
                ))}
              </CmsCardBoxGrid>
            </div>
          </EditorSection>

          <EditorSection eyebrow="VISIBILITY" title="홈 FAQ · 후기 섹션">
            <p className="mb-4 text-sm text-text-secondary">
              홈에 FAQ·후기 영역만 켜거나 끕니다. 항목
              추가·수정·홈 노출은 FAQ·학습 후기 탭에서만 할 수 있습니다.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
              <CmsVisibilityToggle
                label="홈 화면에 FAQ 섹션 표시"
                section="home_page"
                visibilityKey="show_faq_section"
                visibilityDefault="0"
                getValue={getValue}
                onToggleVisible={saveContent}
              />
              <CmsVisibilityToggle
                label="홈 화면에 학습 후기 섹션 표시"
                section="home_page"
                visibilityKey="show_reviews_section"
                visibilityDefault="1"
                getValue={getValue}
                onToggleVisible={saveContent}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActivePage("faq")}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-text-primary transition hover:border-primary hover:text-primary"
              >
                FAQ 탭에서 관리 ({faqs.filter((item) => item.isActive && item.showOnHome).length}개 홈 노출)
              </button>
              <button
                type="button"
                onClick={() => setActivePage("reviews")}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-text-primary transition hover:border-primary hover:text-primary"
              >
                학습 후기 탭에서 관리 (
                {testimonials.filter((item) => item.isActive && item.showOnHome).length}개 홈 노출)
              </button>
            </div>
          </EditorSection>

          <EditorSection eyebrow="HOME PRICING" title="홈 요금제 섹션">
            <div className="grid gap-4 lg:grid-cols-2">
              {homePricingFields.map((field) => (
                <ContentField
                  key={`${field.section}-${field.keyName}`}
                  field={field}
                  value={getValue(field.section, field.keyName, field.defaultValue)}
                  onSave={saveContent}
                />
              ))}
            </div>
          </EditorSection>

          <EditorSection eyebrow="FOOTER" title="푸터">
            <div className="grid gap-4 lg:grid-cols-2">
              {footerFields.map((field) => (
                <AdminTextField
                  key={`${field.section}-${field.keyName}`}
                  field={field}
                  value={getValue(field.section, field.keyName, field.defaultValue)}
                  getValue={getValue}
                  onSave={saveContent}
                />
              ))}
            </div>
          </EditorSection>

          <EditorSection eyebrow="NAVIGATION LABELS" title="스티키 탭·섹션 라벨">
            <div className="grid gap-4 lg:grid-cols-2">
              {homeLabelsFields.map((field) => (
                <ContentField
                  key={`${field.section}-${field.keyName}`}
                  field={field}
                  value={getValue(field.section, field.keyName, field.defaultValue)}
                  onSave={saveContent}
                />
              ))}
            </div>
          </EditorSection>

          <EditorSection eyebrow="COMPARISON TABLE" title="서비스 비교 테이블">
            <div className="grid gap-4 lg:grid-cols-2">
              <ContentField
                field={compareKickerField}
                value={getValue(compareKickerField.section, compareKickerField.keyName, compareKickerField.defaultValue)}
                onSave={saveContent}
              />
              <ContentField
                field={compareTableTitleField}
                value={getValue(compareTableTitleField.section, compareTableTitleField.keyName, compareTableTitleField.defaultValue)}
                onSave={saveContent}
              />
            </div>
            <div className="mt-6">
              <CmsCardBoxGrid>
                {Array.from({ length: COMPARE_ROW_COUNT }, (_, idx) => idx + 1).map((slot) => (
                  <CmsCardBox
                    key={slot}
                    label={`비교 행 ${slot}`}
                    section="compare"
                    visibilityKey={`row${slot}_visible`}
                    visibilityDefault="1"
                    getValue={getValue}
                    onToggleVisible={saveContent}
                  >
                    {compareRowInnerFields(slot).map((field) => (
                      <ContentField
                        key={`${field.section}-${field.keyName}`}
                        field={field}
                        value={getValue(field.section, field.keyName, field.defaultValue)}
                        onSave={saveContent}
                      />
                    ))}
                  </CmsCardBox>
                ))}
              </CmsCardBoxGrid>
            </div>
          </EditorSection>

            </>
          ) : null}

          {activePage === "pricing" ? (
            <EditorSection eyebrow="PRICING" title="요금제 페이지">
              <p className="mb-5 text-sm text-text-secondary">
                카드는 「박스 1~{CMS_MANAGED_CARD_SLOT_COUNT}」로 관리합니다. 「고등」은 pricing_box_ 키, 「중등」은 pricing_middle_box_ 키를 사용합니다.
                중등 값이 비어 있으면 고등 값을 기본으로 씁니다. 금액은 v2 플랜에서 자동 산출되며 CMS에서 수정할 수 없습니다.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                {pricingHeaderFields.map((field) => (
                  <AdminTextField
                    key={`${field.section}-${field.keyName}`}
                    field={field}
                    value={getValue(field.section, field.keyName, field.defaultValue)}
                    getValue={getValue}
                    onSave={saveContent}
                  />
                ))}
              </div>
              <div className="mt-6">
                <p className="mb-4 text-xs font-black text-primary">고등 카드 세트</p>
                <CmsCardBoxGrid>
                  {Array.from({ length: CMS_MANAGED_CARD_SLOT_COUNT }, (_, idx) => idx + 1).map((slot) => (
                    <CmsCardBox
                      key={slot}
                      label={`고등 요금 카드 박스 ${slot}`}
                      section="pricing_page"
                      visibilityKey={pricingBoxFieldKey(slot, "visible")}
                      visibilityDefault={slot <= 4 ? "1" : "0"}
                      getValue={getValue}
                      onToggleVisible={saveContent}
                    >
                      {pricingSlotInnerFields(slot).map((field) => (
                        <ContentField
                          key={`${field.section}-${field.keyName}`}
                          field={field}
                          value={getValue(field.section, field.keyName, field.defaultValue)}
                          onSave={saveContent}
                        />
                      ))}
                    </CmsCardBox>
                  ))}
                </CmsCardBoxGrid>
              </div>
              <div className="mt-10">
                <p className="mb-4 text-xs font-black text-primary">중등 카드 세트 (고등 기본값의 기준)</p>
                <CmsCardBoxGrid>
                  {Array.from({ length: CMS_MANAGED_CARD_SLOT_COUNT }, (_, idx) => idx + 1).map((slot) => (
                    <CmsCardBox
                      key={`mid-${slot}`}
                      label={`중등 요금 카드 박스 ${slot}`}
                      section="pricing_page"
                      visibilityKey={pricingMiddleBoxFieldKey(slot, "visible")}
                      visibilityDefault={slot <= 4 ? "1" : "0"}
                      getValue={getValue}
                      onToggleVisible={saveContent}
                    >
                      {pricingSlotInnerFields(slot, pricingMiddleBoxFieldKey).map((field) => (
                        <ContentField
                          key={`${field.section}-${field.keyName}`}
                          field={field}
                          value={getValue(field.section, field.keyName, field.defaultValue)}
                          onSave={saveContent}
                        />
                      ))}
                    </CmsCardBox>
                  ))}
                </CmsCardBoxGrid>
              </div>
              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {pricingFaqFields.map((field) => (
                  <ContentField
                    key={`${field.section}-${field.keyName}`}
                    field={field}
                    value={getValue(field.section, field.keyName, field.defaultValue)}
                    onSave={saveContent}
                  />
                ))}
              </div>
            </EditorSection>
          ) : null}

          {activePage === "tutors" ? (
            <EditorSection eyebrow="TUTORS" title="강사진 페이지">
              <div className="grid gap-4 lg:grid-cols-2">
                {tutorsPageFields.map((field) => (
                  <ContentField
                    key={`${field.section}-${field.keyName}`}
                    field={field}
                    value={getValue(field.section, field.keyName, field.defaultValue)}
                    onSave={saveContent}
                  />
                ))}
              </div>
              <p className="mt-6 text-sm text-text-secondary">
                공개 강사진에는 선생님이 올린 프로필 사진을 우선 표시합니다. 사진이 없으면 아래 성별 기본 이미지를
                씁니다. 빈 카드 문구·승인·공개 프로필 필드는 아래 목록에서 바로 수정할 수 있습니다.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ImageField
                  field={{
                    label: "공개용 기본 사진 (남)",
                    section: "tutors_page",
                    keyName: "public_photo_male",
                    defaultValue: "/images/teachers/default-male.png",
                  }}
                  value={getValue("tutors_page", "public_photo_male", "/images/teachers/default-male.png")}
                  onSave={saveContent}
                />
                <ImageField
                  field={{
                    label: "공개용 기본 사진 (여)",
                    section: "tutors_page",
                    keyName: "public_photo_female",
                    defaultValue: "/images/teachers/default-female.png",
                  }}
                  value={getValue("tutors_page", "public_photo_female", "/images/teachers/default-female.png")}
                  onSave={saveContent}
                />
              </div>
              <CmsPublicTeachersPanel />
            </EditorSection>
          ) : null}

          {activePage === "faq" ? (
            <>
              <EditorSection eyebrow="FAQ" title="FAQ 페이지">
                <p className="mb-4 text-sm text-text-secondary">
                  질문·답변을 추가하고, FAQ 페이지·홈 화면 노출 여부를 각 항목에서 설정합니다.
                </p>
                <div className="mb-6 max-w-md">
                  <CmsVisibilityToggle
                    label="FAQ 개별 페이지(/faq) 표시"
                    section="faq_page"
                    visibilityKey="show_page"
                    getValue={getValue}
                    onToggleVisible={saveContent}
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {buildExtraFields("faq_page").map((field) => (
                    <ContentField
                      key={`${field.section}-${field.keyName}`}
                      field={field}
                      value={getValue(field.section, field.keyName, field.defaultValue)}
                      onSave={saveContent}
                    />
                  ))}
                </div>
              </EditorSection>
              <EditorSection
                eyebrow="FAQ ITEMS"
                title="질문·답변 목록"
                action={
                  <button
                    type="button"
                    onClick={() => void addFaq()}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                  >
                    FAQ 추가
                  </button>
                }
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFaqDragEnd}>
                  <SortableContext items={faqs.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {faqs.map((item) => (
                        <SortableFaq
                          key={item.id}
                          item={item}
                          onSave={patchFaq}
                          onDelete={() => void deleteFaq(item.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </EditorSection>
            </>
          ) : null}

          {activePage === "reviews" ? (
            <>
              <EditorSection eyebrow="REVIEWS" title="학습 후기 페이지">
                <p className="mb-4 text-sm text-text-secondary">
                  후기를 추가하고, 후기 페이지·홈 화면 노출 여부를 각 항목에서 설정합니다.
                </p>
                <div className="mb-6 max-w-md">
                  <CmsVisibilityToggle
                    label="학습 후기 개별 페이지(/reviews) 표시"
                    section="reviews_page"
                    visibilityKey="show_page"
                    getValue={getValue}
                    onToggleVisible={saveContent}
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {[
                    ...buildFieldsFromDefaults(reviewsBenchmarkDefaults, "reviews_page"),
                    ...buildExtraFields("reviews_page"),
                  ].map((field) => (
                    <ContentField
                      key={`${field.section}-${field.keyName}`}
                      field={field}
                      value={getValue(field.section, field.keyName, field.defaultValue)}
                      onSave={saveContent}
                    />
                  ))}
                </div>
              </EditorSection>
              <EditorSection eyebrow="REVIEWS · SUCCESS" title="성적 변화 사례 카드">
                <p className="mb-4 text-sm text-text-secondary">
                  후기 페이지 상단 성적 변화 캐러셀입니다. 카드별 노출은 &quot;노출&quot; 값을 0으로 두면 숨겨집니다.
                </p>
                <div className="grid gap-4 lg:grid-cols-2">
                  {buildFieldsFromDefaults(reviewsBenchmarkDefaults, "reviews_success").map((field) => (
                    <ContentField
                      key={`${field.section}-${field.keyName}`}
                      field={field}
                      value={getValue(field.section, field.keyName, field.defaultValue)}
                      onSave={saveContent}
                    />
                  ))}
                </div>
              </EditorSection>
              <EditorSection eyebrow="REVIEWS · PROOF" title="실물 인증 카드">
                <div className="grid gap-4 lg:grid-cols-2">
                  {buildFieldsFromDefaults(reviewsBenchmarkDefaults, "reviews_proof").map((field) => (
                    <ContentField
                      key={`${field.section}-${field.keyName}`}
                      field={field}
                      value={getValue(field.section, field.keyName, field.defaultValue)}
                      onSave={saveContent}
                    />
                  ))}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {buildImageFieldsFromDefaults(reviewsBenchmarkDefaults, "reviews_proof").map((field) => (
                    <ImageField
                      key={`${field.section}-${field.keyName}`}
                      field={field}
                      value={getValue(field.section, field.keyName, field.defaultValue)}
                      onSave={saveContent}
                    />
                  ))}
                </div>
              </EditorSection>
              <EditorSection
                eyebrow="REVIEW ITEMS"
                title="후기 카드 목록"
                action={
                  <button
                    type="button"
                    onClick={() => void addTestimonial()}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                  >
                    후기 추가
                  </button>
                }
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTestimonialDragEnd}>
                  <SortableContext items={testimonials.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {testimonials.map((item) => (
                        <SortableTestimonial
                          key={item.id}
                          item={item}
                          onSave={patchTestimonial}
                          onDelete={() => void deleteTestimonial(item.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </EditorSection>
            </>
          ) : null}

          {activePage === "login" ? (
            <EditorSection eyebrow="LOGIN" title="로그인 페이지">
              <div className="grid gap-4 lg:grid-cols-2">
                {buildExtraFields("login_page").map((field) => (
                  <ContentField
                    key={`${field.section}-${field.keyName}`}
                    field={field}
                    value={getValue(field.section, field.keyName, field.defaultValue)}
                    onSave={saveContent}
                  />
                ))}
              </div>
            </EditorSection>
          ) : null}

          {activePage === "commerce" ? (
            <>
              <EditorSection eyebrow="CHECKOUT" title="결제 페이지">
                <div className="grid gap-4 lg:grid-cols-2">
                  {buildExtraFields("checkout_page").map((field) => (
                    <ContentField
                      key={`${field.section}-${field.keyName}`}
                      field={field}
                      value={getValue(field.section, field.keyName, field.defaultValue)}
                      onSave={saveContent}
                    />
                  ))}
                </div>
              </EditorSection>
              <EditorSection eyebrow="SUCCESS" title="결제 완료 페이지">
                <div className="grid gap-4 lg:grid-cols-2">
                  {buildExtraFields("success_page").map((field) => (
                    <ContentField
                      key={`${field.section}-${field.keyName}`}
                      field={field}
                      value={getValue(field.section, field.keyName, field.defaultValue)}
                      onSave={saveContent}
                    />
                  ))}
                </div>
              </EditorSection>
            </>
          ) : null}

          {activePage === "portal_student" ? (
            <>
              <EditorSection eyebrow="STUDENT" title="대시보드 · 학습 플래너 · 질문">
                <p className="mb-6 text-sm text-text-secondary">
                  학생 계정의「학습 플래너」화면(/dashboard)과 동일한 문구를 편집합니다. 미리보기는 대시보드 탭을
                  누릅니다.
                </p>
                {PORTAL_STUDENT_SUBSECTIONS.map(({ section, title }) => (
                  <div key={section} className="mb-8 last:mb-0">
                    <h4 className="mb-3 text-sm font-black text-text-primary">{title}</h4>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {buildPortalFields(section).map((field) => (
                        <ContentField
                          key={`${field.section}-${field.keyName}`}
                          field={field}
                          value={getValue(field.section, field.keyName, field.defaultValue)}
                          onSave={saveContent}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </EditorSection>
              <EditorSection eyebrow="CONSULTATION" title="상담 예약 · 방문 시간">
                <p className="mb-6 text-sm text-text-secondary">
                  매칭 전 학생 상담 화면(/dashboard/consultation)과 방문 시간 선택 UI 문구입니다.
                </p>
                {(["student_consultation", "visit_picker"] as const).map((section) => (
                  <div key={section} className="mb-8 last:mb-0">
                    <h4 className="mb-3 text-sm font-black text-text-primary">
                      {section === "student_consultation" ? "상담 페이지" : "방문 시간 피커"}
                    </h4>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {buildPortalFields(section).map((field) => (
                        <ContentField
                          key={`${field.section}-${field.keyName}`}
                          field={field}
                          value={getValue(field.section, field.keyName, field.defaultValue)}
                          onSave={saveContent}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </EditorSection>
            </>
          ) : null}

          {activePage === "portal_teacher" ? (
            <EditorSection eyebrow="TEACHER" title="선생님 · 매니저 포털">
              <p className="mb-6 text-sm text-text-secondary">
                강사·매니저 로그인 후 상단 바·탭 메뉴 문구(/teacher-portal/...)와 맞춥니다.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                {buildPortalFields("teacher_portal").map((field) => (
                  <ContentField
                    key={`${field.section}-${field.keyName}`}
                    field={field}
                    value={getValue(field.section, field.keyName, field.defaultValue)}
                    onSave={saveContent}
                  />
                ))}
              </div>
            </EditorSection>
          ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SelectedFieldEditor({
  field,
  getValue,
  onSave,
}: {
  field: SelectedField;
  getValue: (section: string, key: string, fallback: string) => string;
  onSave: (section: string, key: string, value: string) => Promise<void>;
}) {
  const { section, key } = field;
  const spacingSectionKey = resolveSpacingSectionKey(section, key);

  if (spacingSectionKey) {
    const spacingLabel =
      CMS_ALL_SPACING_SECTIONS.find((item) => item.key === spacingSectionKey)?.label ?? spacingSectionKey;
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="mb-1 text-xs font-black uppercase tracking-wider text-primary">SPACING</p>
        <h3 className="text-lg font-black text-text-primary">{spacingLabel} 여백</h3>
        <div className="mt-4">
          <CmsSpacingSectionRow
            sectionKey={spacingSectionKey}
            label={spacingLabel}
            getValue={getValue}
            onSave={onSave}
          />
        </div>
      </div>
    );
  }

  if (key.endsWith("_size") || key.endsWith("_bold")) {
    const baseKey = key.replace(/_(size|bold)$/, "");
    const styleTarget = getCmsTextStyleTarget(section, baseKey);
    if (styleTarget) {
      return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-black uppercase tracking-wider text-primary">FONT</p>
          <h3 className="text-lg font-black text-text-primary">
            {section}.{baseKey} 폰트 설정
          </h3>
          <div className="mt-4">
            <CmsTextStyleControls
              section={section}
              keyName={baseKey}
              defaultSize={styleTarget.defaultSize}
              defaultBold={styleTarget.defaultBold}
              getValue={getValue}
              onSave={onSave}
            />
          </div>
        </div>
      );
    }
  }

  if (isImageFieldKey(key)) {
    const known = findTextFieldConfig(section, key);
    const imageField: ImageFieldConfig = {
      label: known?.label ?? key,
      section,
      keyName: key,
      defaultValue: known?.defaultValue ?? "",
    };
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="mb-1 text-xs font-black uppercase tracking-wider text-primary">IMAGE</p>
        <h3 className="text-lg font-black text-text-primary">{imageField.label}</h3>
        <div className="mt-4">
          <ImageField
            field={imageField}
            value={getValue(section, key, imageField.defaultValue)}
            onSave={onSave}
          />
        </div>
      </div>
    );
  }

  const textField =
    findTextFieldConfig(section, key) ??
    ({
      label: `${section}.${key}`,
      section,
      keyName: key,
      defaultValue: "",
      kind: "input" as const,
    } satisfies TextFieldConfig);

  const styleTarget = getCmsTextStyleTarget(section, key);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs font-black uppercase tracking-wider text-primary">TEXT</p>
      <h3 className="text-lg font-black text-text-primary">{textField.label}</h3>
      <div className="mt-4">
        {styleTarget ? (
          <AdminTextField
            field={textField}
            value={getValue(section, key, textField.defaultValue)}
            getValue={getValue}
            onSave={onSave}
          />
        ) : (
          <ContentField
            field={textField}
            value={getValue(section, key, textField.defaultValue)}
            onSave={onSave}
          />
        )}
      </div>
    </div>
  );
}

function EditorSection({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-primary">{eyebrow}</p>
          <h3 className="mt-1 text-xl font-black text-text-primary">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function CmsSpacingSectionRow({
  sectionKey,
  label,
  getValue,
  onSave,
}: {
  sectionKey: string;
  label: string;
  getValue: (section: string, key: string, fallback: string) => string;
  onSave: (section: string, key: string, value: string) => Promise<void>;
}) {
  const fields = [
    { suffix: "pt", label: "상단", defaultValue: CMS_SPACING_DEFAULT_PX.pt },
    { suffix: "pb", label: "하단", defaultValue: CMS_SPACING_DEFAULT_PX.pb },
    { suffix: "pl", label: "왼쪽", defaultValue: CMS_SPACING_DEFAULT_PX.pl },
    { suffix: "pr", label: "오른쪽", defaultValue: CMS_SPACING_DEFAULT_PX.pr },
  ] as const;

  return (
    <div className="rounded-2xl border border-gray-100 bg-background p-4">
      <p className="mb-3 text-sm font-black text-text-primary">{label}</p>
      <div className="grid gap-3 sm:grid-cols-4">
        {fields.map((field) => {
          const keyName = `${sectionKey}_${field.suffix}`;
          const value = getValue("spacing", keyName, field.defaultValue);
          return (
            <label key={keyName} className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">
                {field.label}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={value}
                  onChange={(e) => void onSave("spacing", keyName, e.target.value)}
                  className={inputClass}
                />
                <span className="shrink-0 text-xs font-semibold text-text-muted">px</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ContentField({
  field,
  value,
  onSave,
}: {
  field: TextFieldConfig;
  value: string;
  onSave: (section: string, key: string, value: string) => Promise<void>;
}) {
  return (
    <AutoSaveInput
      label={field.label}
      value={value}
      kind={field.kind ?? "input"}
      rows={field.rows}
      onSave={(nextValue) => onSave(field.section, field.keyName, nextValue)}
    />
  );
}

function AdminTextField({
  field,
  value,
  getValue,
  onSave,
}: {
  field: TextFieldConfig;
  value: string;
  getValue: (section: string, key: string, fallback: string) => string;
  onSave: (section: string, key: string, value: string) => Promise<void>;
}) {
  const styleTarget = getCmsTextStyleTarget(field.section, field.keyName);

  return (
    <div className="rounded-2xl bg-background">
      <ContentField field={field} value={value} onSave={onSave} />
      {styleTarget ? (
        <CmsTextStyleControls
          section={field.section}
          keyName={field.keyName}
          defaultSize={styleTarget.defaultSize}
          defaultBold={styleTarget.defaultBold}
          getValue={getValue}
          onSave={onSave}
        />
      ) : null}
    </div>
  );
}

function CmsTextStyleControls({
  section,
  keyName,
  defaultSize,
  defaultBold,
  getValue,
  onSave,
}: {
  section: string;
  keyName: string;
  defaultSize: (typeof CMS_TEXT_SIZE_OPTIONS)[number];
  defaultBold: "0" | "1";
  getValue: (section: string, key: string, fallback: string) => string;
  onSave: (section: string, key: string, value: string) => Promise<void>;
}) {
  const sizeKey = `${keyName}_size`;
  const boldKey = `${keyName}_bold`;
  const sizeValue = getValue(section, sizeKey, defaultSize);
  const boldValue = getValue(section, boldKey, defaultBold);
  const isBold = boldValue !== "0";

  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 px-4 pb-4 pt-3">
      <label className="flex items-center gap-2 text-xs font-semibold text-text-muted">
        <span>크기</span>
        <select
          value={sizeValue}
          onChange={(e) => void onSave(section, sizeKey, e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-text-primary outline-none focus:border-primary"
        >
          {CMS_TEXT_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-text-muted">
        <input
          type="checkbox"
          checked={isBold}
          onChange={(e) => void onSave(section, boldKey, e.target.checked ? "1" : "0")}
          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span>볼드</span>
      </label>
    </div>
  );
}

function AutoSaveInput({
  label,
  value,
  kind = "input",
  rows,
  onSave,
}: {
  label: string;
  value: string;
  kind?: "input" | "textarea";
  rows?: number;
  onSave: (value: string) => Promise<void>;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const firstRender = useRef(true);
  const latestSavedValue = useRef(value);

  useEffect(() => {
    setLocalValue(value);
    latestSavedValue.current = value;
  }, [value]);

  const save = useCallback(
    async (nextValue: string) => {
      if (nextValue === latestSavedValue.current) return;
      setStatus("saving");
      try {
        await onSave(nextValue);
        latestSavedValue.current = nextValue;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [onSave],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      void save(localValue);
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [localValue, save]);

  return (
    <label className="block rounded-2xl bg-background p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</span>
        <SaveIndicator status={status} />
      </div>
      {kind === "textarea" ? (
        <textarea
          value={localValue}
          rows={rows ?? 2}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => void save(localValue)}
          className={textareaClass}
        />
      ) : (
        <input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => void save(localValue)}
          className={inputClass}
        />
      )}
    </label>
  );
}

function ImageField({
  field,
  value,
  onSave,
}: {
  field: ImageFieldConfig;
  value: string;
  onSave: (section: string, key: string, value: string) => Promise<void>;
}) {
  return <ImageUploader label={field.label} value={value || field.defaultValue} onSave={(next) => onSave(field.section, field.keyName, next)} />;
}

function ImageUploader({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  async function save(nextValue: string) {
    setStatus("saving");
    try {
      await onSave(nextValue);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/cms/upload-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { imageUrl: string };
      setLocalValue(data.imageUrl);
      await save(data.imageUrl);
    } catch {
      setStatus("error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-background p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</span>
        <SaveIndicator status={status} />
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {localValue ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={localValue} alt={label} className="h-48 w-full object-cover" />
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-text-muted">이미지 없음</div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          {uploading ? "업로드 중..." : "이미지 업로드"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void uploadImage(e.target.files?.[0]);
              e.currentTarget.value = "";
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setLocalValue("");
            void save("");
          }}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-text-secondary"
        >
          이미지 삭제
        </button>
      </div>
      <input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => void save(localValue)}
        className={`${inputClass} mt-3`}
        placeholder="이미지 URL"
      />
    </div>
  );
}

const FEATURED_TUTOR_DEFAULT_MAP: Record<string, string> = Object.fromEntries(
  tutorsFeaturedDefaults
    .filter((row) => row.section === "tutors_featured")
    .map((row) => [row.key, row.value]),
);

function featuredTutorDefault(cardIndex: number, field: Parameters<typeof featuredTutorFieldKey>[1]): string {
  return FEATURED_TUTOR_DEFAULT_MAP[featuredTutorFieldKey(cardIndex, field)] ?? "";
}

function FeaturedTutorCardEditor({
  index,
  getValue,
  onSave,
}: {
  index: number;
  getValue: (section: string, keyName: string, defaultValue: string) => string;
  onSave: (section: string, key: string, value: string) => Promise<void>;
}) {
  const n = index + 1;
  const textFields: TextFieldConfig[] = [
    { label: "이름", section: "tutors_featured", keyName: featuredTutorFieldKey(n, "name"), defaultValue: featuredTutorDefault(n, "name") },
    { label: "대표 과목 태그", section: "tutors_featured", keyName: featuredTutorFieldKey(n, "tag"), defaultValue: featuredTutorDefault(n, "tag") },
    { label: "출신 대학", section: "tutors_featured", keyName: featuredTutorFieldKey(n, "university"), defaultValue: featuredTutorDefault(n, "university") },
    { label: "지도 과목 (쉼표 구분)", section: "tutors_featured", keyName: featuredTutorFieldKey(n, "subjects"), defaultValue: featuredTutorDefault(n, "subjects") },
    { label: "한 줄 소개", section: "tutors_featured", keyName: featuredTutorFieldKey(n, "blurb"), defaultValue: featuredTutorDefault(n, "blurb"), kind: "textarea", rows: 2 },
    { label: "강점 (줄바꿈 구분)", section: "tutors_featured", keyName: featuredTutorFieldKey(n, "highlights"), defaultValue: featuredTutorDefault(n, "highlights"), kind: "textarea", rows: 2 },
    { label: "해시태그 (줄바꿈 구분)", section: "tutors_featured", keyName: featuredTutorFieldKey(n, "tags"), defaultValue: featuredTutorDefault(n, "tags"), kind: "textarea", rows: 2 },
    { label: "경력 뱃지", section: "tutors_featured", keyName: featuredTutorFieldKey(n, "career_badge"), defaultValue: featuredTutorDefault(n, "career_badge") },
  ];

  return (
    <CmsCardBox
      label={`검증 선생님 카드 ${n}`}
      section="tutors_featured"
      visibilityKey={featuredTutorFieldKey(n, "visible")}
      visibilityDefault={n <= 3 ? "1" : "0"}
      getValue={getValue}
      onToggleVisible={onSave}
    >
      <div className="grid gap-4">
        <ImageField
          field={{
            label: "프로필 사진",
            section: "tutors_featured",
            keyName: featuredTutorFieldKey(n, "photo"),
            defaultValue: featuredTutorDefault(n, "photo"),
          }}
          value={getValue("tutors_featured", featuredTutorFieldKey(n, "photo"), featuredTutorDefault(n, "photo"))}
          onSave={onSave}
        />
        <div className="space-y-3">
          {textFields.map((field) => (
            <ContentField
              key={field.keyName}
              field={field}
              value={getValue(field.section, field.keyName, field.defaultValue)}
              onSave={onSave}
            />
          ))}
        </div>
      </div>
    </CmsCardBox>
  );
}

function StepEditor({
  index,
  defaults,
  getValue,
  onSave,
}: {
  index: number;
  defaults: (typeof stepDefaults)[number];
  getValue: (section: string, keyName: string, defaultValue: string) => string;
  onSave: (section: string, key: string, value: string) => Promise<void>;
}) {
  const number = index + 1;
  return (
    <CmsCardBox
      label={`진행 단계 카드 박스 ${number}`}
      section="features"
      visibilityKey={`step${number}_visible`}
      visibilityDefault={number <= 5 ? "1" : "0"}
      getValue={getValue}
      onToggleVisible={onSave}
    >
      <div className="grid gap-4">
        <ImageField
          field={{
            label: "단계 이미지",
            section: "features",
            keyName: `step${number}_image`,
            defaultValue: defaults.image,
          }}
          value={getValue("features", `step${number}_image`, defaults.image)}
          onSave={onSave}
        />
        <div className="space-y-3">
          <ContentField
            field={{
              label: "제목",
              section: "features",
              keyName: `step${number}_title`,
              defaultValue: defaults.title,
            }}
            value={getValue("features", `step${number}_title`, defaults.title)}
            onSave={onSave}
          />
          <ContentField
            field={{
              label: "설명",
              section: "features",
              keyName: `step${number}_desc`,
              defaultValue: defaults.desc,
              kind: "textarea",
              rows: 3,
            }}
            value={getValue("features", `step${number}_desc`, defaults.desc)}
            onSave={onSave}
          />
        </div>
      </div>
    </CmsCardBox>
  );
}

function SurfaceToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        active ? "bg-primary/10 text-primary" : "bg-gray-100 text-text-muted"
      }`}
    >
      {label}
    </button>
  );
}

function SortableTestimonial({
  item,
  onSave,
  onDelete,
}: {
  item: TestimonialRow;
  onSave: (id: string, payload: Partial<TestimonialRow>) => Promise<void>;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="grid gap-4 rounded-2xl bg-background p-4 lg:grid-cols-[2rem_1fr_260px]">
      <button type="button" className="cursor-grab self-start text-xl text-text-muted" {...attributes} {...listeners}>
        ⋮⋮
      </button>
      <div className="grid gap-3">
        <AutoSaveInput
          label="카드 제목 (2줄 권장, 줄바꿈 가능 · 예: 관리는 철저하게, ↵ 공부는 자유롭게)"
          value={item.title ?? ""}
          kind="textarea"
          rows={2}
          onSave={(value) => onSave(item.id, { title: value || null })}
        />
        <AutoSaveInput label="후기 문구" value={item.quote} kind="textarea" rows={4} onSave={(value) => onSave(item.id, { quote: value })} />
        <AutoSaveInput label="작성자 (예: 고2 수학 · 학부모)" value={item.author} onSave={(value) => onSave(item.id, { author: value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <AutoSaveInput
            label="성적 변화 시작 (예: 3등급 · 비우면 별점 표시)"
            value={item.gradeFrom ?? ""}
            onSave={(value) => onSave(item.id, { gradeFrom: value || null })}
          />
          <AutoSaveInput
            label="성적 변화 도착 (예: 1등급)"
            value={item.gradeTo ?? ""}
            onSave={(value) => onSave(item.id, { gradeTo: value || null })}
          />
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-text-secondary">고민 카테고리</span>
          <select
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={item.category ?? ""}
            onChange={(event) => void onSave(item.id, { category: event.target.value || null })}
          >
            <option value="">선택 안 함</option>
            {REVIEW_CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                #{cat}
              </option>
            ))}
          </select>
        </label>
        <AutoSaveInput
          label="태그 (줄바꿈으로 구분)"
          value={item.tags ?? ""}
          kind="textarea"
          rows={2}
          onSave={(value) => onSave(item.id, { tags: value || null })}
        />
        <div className="flex flex-wrap gap-2">
          <SurfaceToggleButton
            active={item.isActive}
            label={item.isActive ? "사용" : "숨김"}
            onClick={() => void onSave(item.id, { isActive: !item.isActive })}
          />
          <SurfaceToggleButton
            active={item.showOnReviewsPage}
            label="후기 페이지"
            onClick={() => void onSave(item.id, { showOnReviewsPage: !item.showOnReviewsPage })}
          />
          <SurfaceToggleButton
            active={item.showOnHome}
            label="홈 표시"
            onClick={() => void onSave(item.id, { showOnHome: !item.showOnHome })}
          />
          <button type="button" onClick={onDelete} className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
            삭제
          </button>
        </div>
      </div>
      <ImageUploader label="후기 이미지" value={item.imageUrl ?? ""} onSave={(value) => onSave(item.id, { imageUrl: value || null })} />
    </div>
  );
}

function SortableFaq({
  item,
  onSave,
  onDelete,
}: {
  item: FaqRow;
  onSave: (id: string, payload: Partial<FaqRow>) => Promise<void>;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="grid gap-4 rounded-2xl bg-background p-4 lg:grid-cols-[2rem_1fr_auto]">
      <button type="button" className="cursor-grab self-start text-xl text-text-muted" {...attributes} {...listeners}>
        ⋮⋮
      </button>
      <div className="grid gap-3">
        <AutoSaveInput label="질문" value={item.question} kind="textarea" rows={2} onSave={(value) => onSave(item.id, { question: value })} />
        <AutoSaveInput label="답변" value={item.answer} kind="textarea" rows={4} onSave={(value) => onSave(item.id, { answer: value })} />
      </div>
      <div className="flex flex-wrap gap-2 lg:max-w-[9rem] lg:flex-col">
        <SurfaceToggleButton
          active={item.isActive}
          label={item.isActive ? "사용" : "숨김"}
          onClick={() => void onSave(item.id, { isActive: !item.isActive })}
        />
        <SurfaceToggleButton
          active={item.showOnFaqPage}
          label="FAQ 페이지"
          onClick={() => void onSave(item.id, { showOnFaqPage: !item.showOnFaqPage })}
        />
        <SurfaceToggleButton
          active={item.showOnHome}
          label="홈 표시"
          onClick={() => void onSave(item.id, { showOnHome: !item.showOnHome })}
        />
        <button type="button" onClick={onDelete} className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
          삭제
        </button>
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") return <span className="text-xs text-text-muted">저장 중...</span>;
  if (status === "saved") return <span className="text-xs font-semibold text-emerald-700">저장됨 ✓</span>;
  if (status === "error") return <span className="text-xs font-semibold text-accent">저장 실패</span>;
  return <span className="text-xs text-text-muted">자동 저장</span>;
}
