"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "./SiteHeader";

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
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80",
    highlight: "전교꼴등에서 서울대학교 입학했어요",
    careers: ["서울대학교 수리과학부", "입시 수학 7년", "최상위권 심화반 운영"],
  },
  {
    subject: "영어",
    name: "Teacher Olivia",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80",
    highlight: "읽기 습관만 바꿔도 점수는 달라집니다",
    careers: ["연세대학교 영어영문학과", "국제학교/토플 지도", "첨삭 1,800시간+"],
  },
  {
    subject: "물리",
    name: "Teacher Peter",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80",
    highlight: "공식보다 먼저 직관을 세워요",
    careers: ["KAIST 전기및전자공학부", "물리·수학 통합 지도", "STEM 멘토 수상"],
  },
  {
    subject: "국어",
    name: "Teacher Jiwoo",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80",
    highlight: "지문을 읽는 규칙을 훈련합니다",
    careers: ["서울대학교 국어국문학과", "논술 전문 프라이빗", "내신 국어 맞춤 관리"],
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
];

const faqs = [
  {
    q: "상담은 어떻게 진행되나요?",
    a: "상담 신청 후 담당 매니저가 전화로 학생의 현재 수준, 목표, 일정, 성향을 확인합니다.",
  },
  {
    q: "선생님 매칭은 얼마나 걸리나요?",
    a: "상담 후 보통 1~3일 안에 후보 선생님을 추천드리며, 일정 조율 후 수업을 시작합니다.",
  },
  {
    q: "수업 중간에 선생님을 바꿀 수 있나요?",
    a: "첫 수업 이후 적합도가 맞지 않으면 매니저와 상의해 다른 선생님으로 조정할 수 있습니다.",
  },
  {
    q: "환불 정책이 어떻게 되나요?",
    a: "개강 전 취소는 전액 환불되며, 개강 후에는 이용한 수업 횟수를 제외하고 정산합니다.",
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

function useScrollLandingState() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const hero = document.getElementById("hero");
      const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : window.innerHeight;
      setShowFloating(window.scrollY > heroBottom - 120);

      const next = tabs
        .map((tab) => document.getElementById(tab.id))
        .filter(Boolean)
        .reverse()
        .find((s) => (s as HTMLElement).offsetTop - 180 <= window.scrollY);

      if (next?.id) setActiveTab(next.id);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { activeTab, showFloating };
}

function useHorizontalScroll() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const cardsRef   = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const wrapper = wrapperRef.current;
      const cards   = cardsRef.current;
      if (!wrapper || !cards) return;
      const rect       = wrapper.getBoundingClientRect();
      const scrollable = wrapper.offsetHeight - window.innerHeight;
      const progress   = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      const maxT       = Math.max(cards.scrollWidth - window.innerWidth, 0);
      cards.style.transform = `translateX(${-progress * maxT}px)`;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return { wrapperRef, cardsRef };
}

/* ─────────────────────────────────────────── sub-components ── */

/** Rounded-rectangle perforations along the card bottom (ticket effect, no stars) */
function PunchRow() {
  return (
    <div className="absolute -bottom-3 left-0 flex w-full justify-around px-2">
      {Array.from({ length: 20 }).map((_, i) => (
        <span
          key={i}
          className="h-6 w-3.5 shrink-0 rounded-[5px] bg-neutral-10"
        />
      ))}
    </div>
  );
}

function PricingCard({
  title,
  price,
  subtitle,
  features,
  sessions,
  recommended,
  active = true,
}: {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  sessions: string;
  recommended?: boolean;
  active?: boolean;
}) {
  return (
    /* h-full so the grid stretches both cards to equal height */
    <article
      className={`${active ? "flex" : "hidden md:flex"} h-full flex-col overflow-hidden rounded-[28px] bg-neutral-10`}
    >
      {/* top ripped gap */}
      <div className="h-10 shrink-0 rounded-t-[28px] bg-neutral-10" />
      {/* main card body — flex-1 so it fills remaining height */}
      <div className="relative flex flex-1 flex-col rounded-t-[28px] bg-neutral-100 p-7 pb-14 text-white md:p-8 md:pb-16">
        {recommended && (
          <span className="absolute right-7 top-7 rounded-xl bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            추천
          </span>
        )}
        <p className="text-xs font-black uppercase tracking-wider text-neutral-30">1:1 맞춤 과외</p>
        <h3 className="mt-4 text-2xl font-black">{title}</h3>
        <p className="mt-4 whitespace-nowrap text-4xl font-black tracking-tight md:text-5xl">{price}</p>
        <p className="mt-2 text-sm text-neutral-40">{subtitle}</p>
        <ul className="mt-7 space-y-3 text-sm font-medium leading-relaxed text-neutral-30">
          {features.map((f) => (
            <li key={f} className="flex gap-3">
              <span className="text-primary">·</span>
              {f}
            </li>
          ))}
        </ul>
        {/* mt-auto pushes CTA to bottom regardless of feature count */}
        <Link
          href={`/checkout?sessions=${sessions}&tutor=1`}
          className="mt-auto inline-flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-primary/90"
          style={{ marginTop: "auto", paddingTop: "1rem" }}
        >
          이 플랜으로 시작
        </Link>
        <PunchRow />
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────── main ── */

export function LandingPage() {
  const { activeTab, showFloating } = useScrollLandingState();
  const { wrapperRef, cardsRef }    = useHorizontalScroll();
  const [priceTab, setPriceTab]     = useState(0);
  const doubledResults  = useMemo(() => [...results, ...results], []);
  const doubledTeachers = useMemo(() => [...teachers, ...teachers], []);

  return (
    <>
      <SiteHeader />

      <main className="text-neutral-100">

        {/* ═══ HERO ═══════════════════════════════════ */}
        <section
          id="hero"
          className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 pt-16 pb-32 text-center md:pt-[100px]"
          style={{ background: "linear-gradient(135deg,#111111 0%,#2a2a2a 100%)" }}
        >
          <div className="absolute inset-0 bg-black/20" />

          {/* centred content */}
          <div className="relative mx-auto max-w-5xl animate-fade-in">
            <h1 className="whitespace-pre-line text-[clamp(2.6rem,6vw,5.5rem)] font-black leading-[1.05] tracking-[-0.04em] text-white">
              {"아이마다 맞는\n선생님이 다릅니다"}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-neutral-30 md:text-lg">
            전문 매니저가 직접 상담하고, 우리 아이에게 꼭 맞는 선생님을 찾아드립니다.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard/consultation"
                className="rounded-full bg-primary px-7 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-primary/90 md:px-8 md:py-4 md:text-base"
              >
                무료 상담 신청
              </Link>
              <Link
                href="/tutors"
                className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-black text-white transition hover:bg-white/10 md:px-8 md:py-4 md:text-base"
              >
                선생님 둘러보기
              </Link>
            </div>
          </div>

          {/* ── Stats — pinned to hero bottom ── */}
          <div className="absolute bottom-8 left-0 right-0 flex flex-wrap justify-center gap-4 px-5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-2xl border border-white/15 bg-white/10 px-8 py-5 backdrop-blur-sm"
              >
                <span className="text-3xl font-black leading-none text-primary md:text-4xl">{s.value}</span>
                <span className="mt-1.5 text-sm font-medium text-white/70">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ STICKY TAB NAV ══════════════════════════ */}
        <nav className="sticky top-16 z-40 border-b border-neutral-20 bg-white shadow-sm md:top-[100px]">
          <div className="scrollbar-hide mx-auto flex max-w-[1200px] overflow-x-auto px-5">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className={`relative shrink-0 px-5 py-4 text-sm transition md:px-7 ${
                  activeTab === tab.id ? "font-black text-primary" : "font-bold text-neutral-40"
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
        <section id="intro" className="overflow-hidden bg-neutral-10 py-20 md:py-28">
          <div className="mx-auto max-w-[1200px] px-5">
            <p className="text-sm font-black uppercase tracking-wider text-primary">RESULTS</p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-[-0.03em] text-neutral-100">
              <span className="text-primary">결과로 증명</span>합니다
            </h2>
          </div>
          <div className="animation-container mt-10 overflow-hidden">
            <div className="animate-slide flex w-max gap-5 px-5 [--speed:28s]">
              {doubledResults.map(([student, before, after], index) => (
                <article
                  key={`${student}-${index}`}
                  className="w-[260px] shrink-0 overflow-hidden rounded-[20px] border border-neutral-20 bg-white shadow-sm md:w-[320px]"
                >
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/90 to-accent/80 p-6">
                    <span className="text-3xl font-black text-white/20">RESULT</span>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-40">{student}</p>
                    <p className="mt-2 text-lg font-black leading-snug text-neutral-100">
                      {before}
                      <span className="text-primary">{after}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS — moved here, between results and teachers ═══ */}
        <section id="testimonials" className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-[1200px] px-5">
            <p className="text-sm font-black uppercase tracking-wider text-primary">REVIEWS</p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-neutral-100">
              학습 후기
            </h2>
            <div className="mt-10 space-y-5">
              {testimonials.map((t) => (
                <article
                  key={t.info}
                  className="grid overflow-hidden rounded-[24px] border border-neutral-20 bg-neutral-10 shadow-sm md:grid-cols-[1fr_340px]"
                >
                  <div className="p-8 md:p-10">
                    {/* Quote mark SVG — not a star */}
                    <svg width="40" height="32" viewBox="0 0 48 38" fill="none" className="text-primary">
                      <path
                        d="M18.5 0C7.8 5.1 1.7 12.8 0 23.1C-1.1 31.1 3.3 37.3 10.9 37.3C16.2 37.3 20.1 33.7 20.1 28.6C20.1 24 17.1 20.7 12.5 20.1C14 14.9 17.5 10.9 23 8L18.5 0ZM43.2 0C32.5 5.1 26.4 12.8 24.7 23.1C23.6 31.1 28 37.3 35.6 37.3C40.9 37.3 44.8 33.7 44.8 28.6C44.8 24 41.8 20.7 37.2 20.1C38.7 14.9 42.2 10.9 47.7 8L43.2 0Z"
                        fill="currentColor"
                      />
                    </svg>
                    <p className="mt-6 text-lg font-black leading-relaxed text-neutral-100 md:text-xl lg:text-2xl">
                      {t.quote}
                    </p>
                    <p className="mt-6 text-sm font-bold text-neutral-50">{t.info}</p>
                  </div>
                  <div className="relative min-h-[240px]">
                    <Image
                      src={t.img}
                      alt={t.info}
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 100vw, 340px"
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TEACHERS — light bg ═════════════════════ */}
        <section id="teachers" className="overflow-hidden bg-neutral-10 py-20 md:py-28">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            {/* sticky heading column */}
            <div className="lg:sticky lg:top-40 lg:self-start">
              <p className="text-sm font-black uppercase tracking-wider text-primary">TEACHERS</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-[-0.03em] text-neutral-100">
                명문대 출신부터
                <br />
                <span className="text-primary">경력 5년 이상</span>
                <br />
                전문가까지
              </h2>
              <p className="mt-4 max-w-sm text-base font-medium leading-relaxed text-neutral-50">
                학생 성향과 목표에 딱 맞는 나만의 선생님을 배정해드립니다.
              </p>
              <Link
                href="/tutors"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-neutral-20 bg-white px-5 py-2.5 text-sm font-black text-neutral-100 transition hover:border-primary hover:text-primary"
              >
                전체 선생님 보기
              </Link>
            </div>

            {/* scrolling teacher cards — light card style */}
            <div className="overflow-hidden">
              <div className="animate-slide flex w-max gap-5 [--speed:34s]">
                {doubledTeachers.map((teacher, index) => (
                  <article
                    key={`${teacher.name}-${index}`}
                    className="w-[260px] shrink-0 rounded-[20px] border border-neutral-20 bg-white p-6 text-center shadow-sm md:w-[300px]"
                  >
                    {/* teacher photo */}
                    <div className="mx-auto h-24 w-24 overflow-hidden rounded-[16px] ring-2 ring-neutral-20">
                      <Image
                        src={teacher.image}
                        alt={teacher.name}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* name + subject inline */}
                    <h3 className="mt-4 text-lg font-black text-neutral-100">
                      {teacher.name} 선생님
                      <span className="ml-1.5 text-sm font-bold text-primary">· {teacher.subject}</span>
                    </h3>
                    {/* highlight */}
                    <p className="mt-3 text-sm font-black leading-snug text-neutral-100">
                      {teacher.highlight.split(" ").slice(0, -2).join(" ")}{" "}
                      <span className="text-primary">{teacher.highlight.split(" ").slice(-2).join(" ")}</span>
                    </p>
                    {/* career list */}
                    <ul className="mt-4 space-y-1.5 text-xs font-medium text-neutral-50">
                      {teacher.careers.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ MANAGEMENT ══════════════════════════════ */}
        <section id="management" className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-[1200px] px-5">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div className="lg:self-center">
                <p className="text-sm font-black uppercase tracking-wider text-primary">LEARNING CARE</p>
                <h2 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-[-0.03em] text-neutral-100">
                  수업 밖에서도
                  <br />
                  이어지는 학습 관리
                </h2>
                <p className="mt-4 max-w-lg text-base font-medium leading-relaxed text-neutral-50">
                  진도, 숙제, 질문, 리포트를 한 화면에서 연결해 학생·선생님·매니저가 같은 목표를 봅니다.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "진도 관리", desc: "주간 진도와 목표 달성률을 매니저·가정과 공유합니다." },
                  { label: "질문 관리", desc: "복습 질문에 대한 즉각 피드백으로 자기주도 학습을 돕습니다." },
                  { label: "리포트",    desc: "월간 학습 데이터와 취약 유형 분석을 리포트로 제공합니다." },
                ].map((item, index) => (
                  <div key={item.label} className="rounded-[20px] bg-neutral-10 p-6">
                    <p className="text-3xl font-black text-primary">0{index + 1}</p>
                    <h3 className="mt-5 text-base font-black text-neutral-100">{item.label}</h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-50">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PROCESS — light bg ══════════════════════ */}
        <section id="process" className="bg-neutral-10 pt-16 pb-0 md:pt-20">
          <div className="mx-auto max-w-[1200px] px-5">
            <p className="text-sm font-black uppercase tracking-wider text-primary">PROCESS</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-neutral-100">
              이렇게 진행됩니다
            </h2>
            <p className="mt-4 max-w-2xl text-base font-medium text-neutral-50">
              상담부터 매칭, 수업까지 1:1로 학생의 성장에 집중해요.
            </p>
          </div>
          {/* horizontal scroll driven by vertical scroll */}
          <div ref={wrapperRef} className="relative mt-8 h-[2600px] md:h-[2200px]">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
              <div
                ref={cardsRef}
                className="flex gap-5 px-5 transition-transform duration-100 will-change-transform md:gap-6 md:px-10"
              >
                {steps.map((step) => (
                  <article
                    key={step.number}
                    className="w-[300px] shrink-0 overflow-hidden rounded-[20px] border border-neutral-20 bg-white shadow-sm md:w-[420px]"
                  >
                    <div className="relative h-[180px] w-full md:h-[220px]">
                      <Image
                        src={step.img}
                        alt={step.title}
                        fill
                        className="object-cover"
                        sizes="(max-width:768px) 300px, 420px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {/* step number overlaid on image bottom-left */}
                      <span className="absolute bottom-4 left-5 text-4xl font-black leading-none text-white/20">
                        {step.number}
                      </span>
                    </div>
                    <div className="p-6 md:p-7">
                      <h3 className="text-lg font-black text-neutral-100 md:text-xl">{step.title}</h3>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-50">{step.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PRICING ═════════════════════════════════ */}
        <section id="pricing" className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-[1200px] px-5">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div className="lg:self-center">
                <p className="text-sm font-black uppercase tracking-wider text-primary">PRICE</p>
                <h2 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-[-0.03em] text-neutral-100">
                  1:1 맞춤 과외,
                  <br />
                  월 40만원부터
                </h2>
                <p className="mt-4 max-w-sm text-base font-medium leading-relaxed text-neutral-50">
                  월 4회 또는 8회 패키지를 선택하세요.
                </p>
              </div>
              <div>
                {/* mobile tab switcher */}
                <div className="mb-5 grid grid-cols-2 rounded-full bg-neutral-10 p-1 md:hidden">
                  {["월 4회", "월 8회"].map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setPriceTab(index)}
                      className={`rounded-full py-3 text-sm font-black transition ${
                        priceTab === index ? "bg-primary text-white" : "text-neutral-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {/* equal-height grid — items-stretch is default on grid, enforced via h-full on articles */}
                <div className="grid items-stretch gap-6 md:grid-cols-2">
                  <PricingCard
                    title="월 4회"
                    price="400,000원"
                    subtitle="주 1회 · 기본 집중"
                    features={[
                      "주 1회 수업 (50분)",
                      "학습 진도 관리",
                      "과제 관리",
                      "AI 질답 이용 가능",
                      "수시 강사 첨삭, 질답",
                    ]}
                    sessions="4"
                    active={priceTab === 0}
                  />
                  <PricingCard
                    title="월 8회"
                    price="720,000원"
                    subtitle="주 2회 · 집중 관리"
                    features={[
                      "주 2회 수업 (50분)",
                      "복수 과목 선택 가능",
                      "학습 진도 관리",
                      "과제 관리",
                      "AI 질답 횟수 2배 제공",
                      "수시 강사 첨삭, 질답",

                    ]}
                    sessions="8"
                    recommended
                    active={priceTab === 1}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ BENEFITS CTA ════════════════════════════ */}
        <section className="bg-primary py-20 md:py-28">
          <div className="mx-auto max-w-[1200px] px-5">
            <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-white">
              지금 신청하면 받을 수 있는 혜택이에요
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {[
                { title: "무료 상담 1회",        desc: "매니저가 직접 학생 상황을 파악합니다." },
                { title: "매니저 직접 배정",      desc: "전문 매니저가 처음부터 함께합니다." },
                { title: "학습 리포트 무료 제공", desc: "첫 달 학습 리포트를 무료로 제공합니다." },
              ].map((b) => (
                <div key={b.title} className="rounded-[20px] bg-white/15 p-6 backdrop-blur md:p-7">
                  <p className="text-lg font-black text-white">{b.title}</p>
                  <p className="mt-3 text-sm font-medium text-white/80">{b.desc}</p>
                </div>
              ))}
            </div>
            {/* CTA button — centred */}
            <div className="mt-12 flex justify-center">
              <Link
                href="/dashboard/consultation"
                className="inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-base font-black text-primary shadow-lg transition hover:bg-neutral-10"
              >
                무료 상담 신청하기
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═════════════════════════════════════ */}
        <section id="faq" className="bg-neutral-80 py-20 text-white md:py-28">
          <div className="mx-auto max-w-[900px] px-5">
            <p className="text-sm font-black uppercase tracking-wider text-primary">FAQ</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-black text-white">자주 묻는 질문</h2>
            <div className="mt-10 divide-y divide-white/10">
              {faqs.map(({ q, a }) => (
                <div key={q} className="py-7">
                  <p className="text-base font-black text-white md:text-lg">Q. {q}</p>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-30 md:text-base">
                    A. {a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FOOTER ══════════════════════════════════ */}
        <footer className="border-t border-neutral-20 bg-neutral-10">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <div className="grid gap-10 border-b border-neutral-20 pb-12 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-black text-neutral-100">상담이 필요하신가요?</h2>
                <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-50">
                  채팅문의 10:00~22:00 · 전화문의 평일 10:00~19:00
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/consultation"
                    className="rounded-full bg-primary px-5 py-2.5 text-sm font-black text-white transition hover:bg-primary/90"
                  >
                    채팅 문의
                  </Link>
                  <a
                    href="tel:010-0000-0000"
                    className="rounded-full border border-neutral-20 bg-white px-5 py-2.5 text-sm font-black text-neutral-100 transition hover:border-neutral-30"
                  >
                    전화 문의
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 text-sm font-bold text-neutral-50">
                <div className="space-y-3">
                  <p className="font-black text-neutral-100">서비스</p>
                  <Link href="/tutors"                 className="block transition hover:text-primary">강사진</Link>
                  <Link href="/pricing"                className="block transition hover:text-primary">요금제</Link>
                  <Link href="/dashboard/consultation" className="block transition hover:text-primary">상담 신청</Link>
                </div>
                <div className="space-y-3">
                  <p className="font-black text-neutral-100">SNS</p>
                  <a href="https://instagram.com"  className="block transition hover:text-primary">Instagram</a>
                  <a href="https://youtube.com"    className="block transition hover:text-primary">YouTube</a>
                  <a href="https://blog.naver.com" className="block transition hover:text-primary">Blog</a>
                </div>
              </div>
            </div>
            <div className="pt-8 text-xs font-medium leading-relaxed text-neutral-40">
              <p>
                상호 주식회사 컨코드에듀케이션 · 대표 홍길동 · 사업자등록번호 123-45-67890
                <br className="hidden sm:block" />
                주소 서울특별시 강남구 테헤란로 000, 00층
              </p>
              <p className="mt-2">이용약관 · 개인정보처리방침 · 환불정책</p>
              <div className="mt-6 flex items-center justify-between">
                <p>© {new Date().getFullYear()} Concord Private Tutoring. All rights reserved.</p>
                <Link href="/teacher-portal" className="text-[11px] text-neutral-40 transition hover:text-primary">
                  선생님이신가요?
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* ═══ FLOATING CTA ════════════════════════════ */}
      <Link
        href="/dashboard/consultation"
        className={`fixed bottom-6 right-6 z-50 rounded-full bg-primary px-6 py-3.5 text-sm font-black text-white shadow-2xl transition duration-300 ${
          showFloating ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        무료 상담 신청
      </Link>
    </>
  );
}
