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

type SaveStatus = "idle" | "saving" | "saved" | "error";
type CmsContent = Record<string, Record<string, string>>;

type TestimonialRow = {
  id: string;
  quote: string;
  author: string;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
};

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
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
    defaultValue: "전문 매니저가 직접 상담하고, 우리 아이에게 꼭 맞는 선생님을 찾아드립니다.",
    kind: "textarea",
    rows: 2,
  },
  { label: "주요 버튼", section: "hero", keyName: "cta_primary", defaultValue: "무료 상담 신청" },
  { label: "보조 버튼", section: "hero", keyName: "cta_secondary", defaultValue: "선생님 둘러보기" },
];

const statsFields: TextFieldConfig[] = [
  { label: "통계 1 숫자", section: "stats", keyName: "stat1_number", defaultValue: "500+" },
  { label: "통계 1 문구", section: "stats", keyName: "stat1_label", defaultValue: "누적 상담" },
  { label: "통계 2 숫자", section: "stats", keyName: "stat2_number", defaultValue: "1,200+" },
  { label: "통계 2 문구", section: "stats", keyName: "stat2_label", defaultValue: "매칭 완료" },
  { label: "통계 3 숫자", section: "stats", keyName: "stat3_number", defaultValue: "98%" },
  { label: "통계 3 문구", section: "stats", keyName: "stat3_label", defaultValue: "학생 만족도" },
];

const resultDefaults = [
  {
    student: "고2 학생",
    before: "수학 5등급→",
    after: "2등급으로 상승",
    image: "/images/teachers/default-male.png",
  },
  {
    student: "중3 학생",
    before: "영어 64점→",
    after: "87점으로 상승",
    image: "/images/teachers/default-female.png",
  },
  {
    student: "고1 학생",
    before: "국어 55점→",
    after: "78점으로 상승",
    image: "/images/teachers/default-male.png",
  },
];

const teacherDefaults = [
  {
    subject: "수학",
    name: "Teacher Noah",
    image: "/images/teachers/default-male.png",
    highlight: "전교꼴등에서 서울대학교 입학했어요",
    careers: "서울대학교 수리과학부\n입시 수학 7년\n최상위권 심화반 운영",
  },
  {
    subject: "영어",
    name: "Teacher Olivia",
    image: "/images/teachers/default-female.png",
    highlight: "읽기 습관만 바꿔도 점수는 달라집니다",
    careers: "연세대학교 영어영문학과\n국제학교/토플 지도\n첨삭 1,800시간+",
  },
  {
    subject: "물리",
    name: "Teacher Peter",
    image: "/images/teachers/default-male.png",
    highlight: "공식보다 먼저 직관을 세워요",
    careers: "KAIST 전기및전자공학부\n물리·수학 통합 지도\nSTEM 멘토 수상",
  },
  {
    subject: "국어",
    name: "Teacher Jiwoo",
    image: "/images/teachers/default-female.png",
    highlight: "지문을 읽는 규칙을 훈련합니다",
    careers: "서울대학교 국어국문학과\n논술 전문 프라이빗\n내신 국어 맞춤 관리",
  },
];

const stepDefaults = [
  {
    title: "무료 상담 신청",
    desc: "학생의 현재 성적, 목표, 성향을 간단히 남겨주세요.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=840&h=380&fit=crop&q=80",
  },
  {
    title: "매니저 배정 및 전화 상담",
    desc: "10년 경력 매니저가 학습 상황과 가족의 우선순위를 듣습니다.",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=840&h=380&fit=crop&q=80",
  },
  {
    title: "선생님 추천 및 매칭",
    desc: "과목, 성향, 일정에 맞는 선생님 후보를 추천합니다.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=840&h=380&fit=crop&q=80",
  },
  {
    title: "수업 시작",
    desc: "첫 수업 후 적합도를 확인하고 필요한 조정을 진행합니다.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=840&h=380&fit=crop&q=80",
  },
  {
    title: "학습 리포트 & 관리",
    desc: "진도, 숙제, 질문, 리포트를 한 흐름으로 관리합니다.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=840&h=380&fit=crop&q=80",
  },
];

const managementFields: TextFieldConfig[] = [
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
  { label: "관리 카드 1 제목", section: "management", keyName: "item1_title", defaultValue: "진도 관리" },
  {
    label: "관리 카드 1 설명",
    section: "management",
    keyName: "item1_desc",
    defaultValue: "주간 진도와 목표 달성률을 매니저·가정과 공유합니다.",
    kind: "textarea",
    rows: 2,
  },
  { label: "관리 카드 2 제목", section: "management", keyName: "item2_title", defaultValue: "질문 관리" },
  {
    label: "관리 카드 2 설명",
    section: "management",
    keyName: "item2_desc",
    defaultValue: "복습 질문에 대한 즉각 피드백으로 자기주도 학습을 돕습니다.",
    kind: "textarea",
    rows: 2,
  },
  { label: "관리 카드 3 제목", section: "management", keyName: "item3_title", defaultValue: "리포트" },
  {
    label: "관리 카드 3 설명",
    section: "management",
    keyName: "item3_desc",
    defaultValue: "월간 학습 데이터와 취약 유형 분석을 리포트로 제공합니다.",
    kind: "textarea",
    rows: 2,
  },
];

const AUTOSAVE_DELAY_MS = 10_000;

const pricingPageFields: TextFieldConfig[] = [
  {
    label: "페이지 제목",
    section: "pricing_page",
    keyName: "header_title",
    defaultValue: "1:1 맞춤 과외,\n월 40만원부터",
    kind: "textarea",
    rows: 2,
  },
  {
    label: "페이지 설명",
    section: "pricing_page",
    keyName: "header_subtext",
    defaultValue:
      "가정의 일정에 맞춰 월 4회 또는 8회 패키지를 선택하세요.\n모든 플랜에 학습관리 시스템이 포함됩니다.",
    kind: "textarea",
    rows: 3,
  },
  { label: "월 4회 제목", section: "pricing_page", keyName: "plan4_title", defaultValue: "월 4회" },
  { label: "월 4회 가격", section: "pricing_page", keyName: "plan4_price", defaultValue: "400,000원" },
  {
    label: "월 4회 부제",
    section: "pricing_page",
    keyName: "plan4_subtitle",
    defaultValue: "주 1회 · 기본 집중",
  },
  {
    label: "월 4회 혜택 (줄바꿈)",
    section: "pricing_page",
    keyName: "plan4_features",
    defaultValue: "주 1회 수업 (50분)\n학습 진도 관리\n과제 관리\nAI 질답 무제한\n강사 첨삭 월 4회",
    kind: "textarea",
    rows: 5,
  },
  { label: "월 8회 제목", section: "pricing_page", keyName: "plan8_title", defaultValue: "월 8회" },
  { label: "월 8회 가격", section: "pricing_page", keyName: "plan8_price", defaultValue: "720,000원" },
  {
    label: "월 8회 부제",
    section: "pricing_page",
    keyName: "plan8_subtitle",
    defaultValue: "주 2회 · 집중 관리",
  },
  {
    label: "월 8회 혜택 (줄바꿈)",
    section: "pricing_page",
    keyName: "plan8_features",
    defaultValue:
      "주 2회 수업 (50분)\n주 2회 집중 관리\n우선 강사 배정\nAI 질답 무제한\n강사 첨삭 무제한\n월간 심층 리포트",
    kind: "textarea",
    rows: 6,
  },
  { label: "FAQ 섹션 제목", section: "pricing_page", keyName: "faq_title", defaultValue: "자주 묻는 질문" },
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
    defaultValue: "체크아웃 페이지에서 카드, 간편결제 등 토스페이먼츠에서 제공하는 수단을 선택하실 수 있습니다.",
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

const CMS_PAGES = [
  { id: "home", label: "홈", previewHref: "/" },
  { id: "pricing", label: "요금제", previewHref: "/pricing" },
  { id: "tutors", label: "강사진", previewHref: "/tutors" },
] as const;

type CmsPageId = (typeof CMS_PAGES)[number]["id"];

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

export function AdminCmsPage() {
  const sensors = useSensors(useSensor(PointerSensor));
  const [activePage, setActivePage] = useState<CmsPageId>("home");
  const [content, setContent] = useState<CmsContent>({});
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const previewHref = CMS_PAGES.find((page) => page.id === activePage)?.previewHref ?? "/";

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
      if (testimonialRes.ok) setTestimonials((await testimonialRes.json()) as TestimonialRow[]);
      if (faqRes.ok) setFaqs((await faqRes.json()) as FaqRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  async function initDefaults() {
    const res = await fetch("/api/admin/cms/init", { method: "POST" });
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
        imageUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=640&h=520&fit=crop&q=80",
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
    <div className="relative pb-16">
      <a
        href={previewHref}
        target="_blank"
        rel="noreferrer"
        className="fixed right-6 top-20 z-40 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg"
      >
        페이지 미리보기
      </a>

      <div>
        <h2 className="text-2xl font-black text-text-primary">사이트 콘텐츠 관리</h2>
        <p className="mt-2 text-sm text-text-secondary">
          각 페이지 문구와 사진을 바로 편집합니다. 자동 저장은 입력 후 약 10초 뒤에 반영되며, 공개 페이지에는 최대 60초 내에
          적용됩니다.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-gray-200 pb-1">
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

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void initDefaults()}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-text-secondary"
        >
          기본값으로 초기화
        </button>
      </div>

      {hasNoContent ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-bold text-amber-950">기본 콘텐츠가 없습니다.</p>
          <p className="mt-1 text-sm text-amber-900">기본값으로 초기화하면 현재 홈페이지 문구와 사진으로 시작합니다.</p>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-text-secondary">불러오는 중...</p>
      ) : (
        <div className="mt-8 space-y-8">
          {activePage === "home" ? (
            <>
          <EditorSection eyebrow="HERO" title="첫 화면">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-4">
                {heroFields.map((field) => (
                  <ContentField
                    key={`${field.section}-${field.keyName}`}
                    field={field}
                    value={getValue(field.section, field.keyName, field.defaultValue)}
                    onSave={patchContent}
                  />
                ))}
              </div>
              <ImageField
                field={{ label: "히어로 배경 이미지", section: "hero", keyName: "bg_image_url", defaultValue: "" }}
                value={getValue("hero", "bg_image_url", "")}
                onSave={patchContent}
              />
            </div>
          </EditorSection>

          <EditorSection eyebrow="STATS" title="히어로 하단 통계">
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 2, 4].map((start, index) => (
                <div key={index} className="rounded-2xl bg-background p-4">
                  <p className="mb-3 text-sm font-black text-primary">통계 {index + 1}</p>
                  <div className="space-y-3">
                    {statsFields.slice(start, start + 2).map((field) => (
                      <ContentField
                        key={`${field.section}-${field.keyName}`}
                        field={field}
                        value={getValue(field.section, field.keyName, field.defaultValue)}
                        onSave={patchContent}
                      />
                    ))}
                  </div>
                </div>
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
                onSave={patchContent}
              />
              <div className="grid gap-4 md:grid-cols-3">
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
                    <div key={number} className="rounded-2xl bg-background p-4">
                      <p className="mb-3 text-sm font-black text-primary">결과 {number}</p>
                      <div className="grid gap-4">
                        <ImageField
                          field={{
                            label: "카드 상단 이미지",
                            section: "results",
                            keyName: `result${number}_image`,
                            defaultValue: result.image,
                          }}
                          value={getValue("results", `result${number}_image`, result.image)}
                          onSave={patchContent}
                        />
                        <div className="space-y-3">
                          {fields.map((field) => (
                            <ContentField
                              key={field.keyName}
                              field={field}
                              value={getValue(field.section, field.keyName, field.defaultValue)}
                              onSave={patchContent}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </EditorSection>

          <EditorSection
            eyebrow="REVIEWS"
            title="학습 후기"
            action={
              <button type="button" onClick={() => void addTestimonial()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
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

          <EditorSection eyebrow="TEACHERS" title="선생님 카드">
            <div className="grid gap-4">
              <ContentField
                field={{
                  label: "섹션 제목",
                  section: "teachers",
                  keyName: "section_title",
                  defaultValue: "명문대 출신부터\n경력 5년 이상\n전문가까지",
                  kind: "textarea",
                  rows: 3,
                }}
                value={getValue("teachers", "section_title", "명문대 출신부터\n경력 5년 이상\n전문가까지")}
                onSave={patchContent}
              />
              <ContentField
                field={{
                  label: "섹션 설명",
                  section: "teachers",
                  keyName: "section_subtext",
                  defaultValue: "학생 성향과 목표에 딱 맞는 나만의 선생님을 배정해드립니다.",
                  kind: "textarea",
                  rows: 2,
                }}
                value={getValue("teachers", "section_subtext", "학생 성향과 목표에 딱 맞는 나만의 선생님을 배정해드립니다.")}
                onSave={patchContent}
              />
              <div className="grid gap-4 xl:grid-cols-2">
                {teacherDefaults.map((teacher, index) => (
                  <TeacherCardEditor
                    key={index}
                    index={index}
                    defaults={teacher}
                    getValue={getValue}
                    onSave={patchContent}
                  />
                ))}
              </div>
            </div>
          </EditorSection>

          <EditorSection eyebrow="LEARNING CARE" title="학습 관리">
            <div className="grid gap-4 lg:grid-cols-2">
              {managementFields.map((field) => (
                <ContentField
                  key={`${field.section}-${field.keyName}`}
                  field={field}
                  value={getValue(field.section, field.keyName, field.defaultValue)}
                  onSave={patchContent}
                />
              ))}
            </div>
          </EditorSection>

          <EditorSection eyebrow="PROCESS" title="진행 방식">
            <div className="grid gap-4">
              <ContentField
                field={{
                  label: "섹션 제목",
                  section: "features",
                  keyName: "section_title",
                  defaultValue: "이렇게 진행됩니다",
                }}
                value={getValue("features", "section_title", "이렇게 진행됩니다")}
                onSave={patchContent}
              />
              <ContentField
                field={{
                  label: "섹션 설명",
                  section: "features",
                  keyName: "section_subtext",
                  defaultValue: "상담부터 매칭, 수업까지 1:1로 학생의 성장에 집중해요.",
                  kind: "textarea",
                  rows: 2,
                }}
                value={getValue("features", "section_subtext", "상담부터 매칭, 수업까지 1:1로 학생의 성장에 집중해요.")}
                onSave={patchContent}
              />
              <div className="grid gap-4 xl:grid-cols-2">
                {stepDefaults.map((step, index) => (
                  <StepEditor key={index} index={index} defaults={step} getValue={getValue} onSave={patchContent} />
                ))}
              </div>
            </div>
          </EditorSection>

          <EditorSection eyebrow="CTA" title="혜택 안내">
            <div className="grid gap-4 lg:grid-cols-2">
              {ctaFields.map((field) => (
                <ContentField
                  key={`${field.section}-${field.keyName}`}
                  field={field}
                  value={getValue(field.section, field.keyName, field.defaultValue)}
                  onSave={patchContent}
                />
              ))}
            </div>
          </EditorSection>

          <EditorSection
            eyebrow="FAQ"
            title="자주 묻는 질문"
            action={
              <button type="button" onClick={() => void addFaq()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
                FAQ 추가
              </button>
            }
          >
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFaqDragEnd}>
              <SortableContext items={faqs.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {faqs.map((item) => (
                    <SortableFaq key={item.id} item={item} onSave={patchFaq} onDelete={() => void deleteFaq(item.id)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </EditorSection>
            </>
          ) : null}

          {activePage === "pricing" ? (
            <EditorSection eyebrow="PRICING" title="요금제 페이지">
              <div className="grid gap-4 lg:grid-cols-2">
                {pricingPageFields.map((field) => (
                  <ContentField
                    key={`${field.section}-${field.keyName}`}
                    field={field}
                    value={getValue(field.section, field.keyName, field.defaultValue)}
                    onSave={patchContent}
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
                    onSave={patchContent}
                  />
                ))}
              </div>
            </EditorSection>
          ) : null}
        </div>
      )}
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

function TeacherCardEditor({
  index,
  defaults,
  getValue,
  onSave,
}: {
  index: number;
  defaults: (typeof teacherDefaults)[number];
  getValue: (section: string, keyName: string, defaultValue: string) => string;
  onSave: (section: string, key: string, value: string) => Promise<void>;
}) {
  const number = index + 1;
  const textFields: TextFieldConfig[] = [
    { label: "과목", section: "teachers", keyName: `teacher${number}_subject`, defaultValue: defaults.subject },
    { label: "이름", section: "teachers", keyName: `teacher${number}_name`, defaultValue: defaults.name },
    {
      label: "강조 문구",
      section: "teachers",
      keyName: `teacher${number}_highlight`,
      defaultValue: defaults.highlight,
      kind: "textarea",
      rows: 2,
    },
    {
      label: "이력 (줄바꿈으로 구분)",
      section: "teachers",
      keyName: `teacher${number}_careers`,
      defaultValue: defaults.careers,
      kind: "textarea",
      rows: 3,
    },
  ];

  return (
    <div className="rounded-2xl bg-background p-4">
      <p className="mb-4 text-sm font-black text-primary">선생님 {number}</p>
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <ImageField
          field={{
            label: "프로필 이미지",
            section: "teachers",
            keyName: `teacher${number}_image`,
            defaultValue: defaults.image,
          }}
          value={getValue("teachers", `teacher${number}_image`, defaults.image)}
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
    </div>
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
    <div className="rounded-2xl bg-background p-4">
      <p className="mb-4 text-sm font-black text-primary">STEP {number}</p>
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
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
    </div>
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
        <AutoSaveInput label="후기 문구" value={item.quote} kind="textarea" rows={4} onSave={(value) => onSave(item.id, { quote: value })} />
        <AutoSaveInput label="작성자" value={item.author} onSave={(value) => onSave(item.id, { author: value })} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onSave(item.id, { isActive: !item.isActive })}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              item.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-text-muted"
            }`}
          >
            {item.isActive ? "활성" : "비활성"}
          </button>
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
      <div className="flex gap-2 lg:flex-col">
        <button
          type="button"
          onClick={() => void onSave(item.id, { isActive: !item.isActive })}
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            item.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-text-muted"
          }`}
        >
          {item.isActive ? "활성" : "비활성"}
        </button>
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
