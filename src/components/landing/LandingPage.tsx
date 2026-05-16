"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "./SiteHeader";

const tabs = [
  { id: "intro", label: "서비스 소개" },
  { id: "teachers", label: "선생님" },
  { id: "management", label: "학습 관리" },
  { id: "process", label: "진행 방식" },
  { id: "pricing", label: "요금제" },
];

const results = [
  ["고2 학생", "수학 5등급→", "2등급으로 상승"],
  ["중3 학생", "영어 64점→", "87점으로 상승"],
  ["고1 학생", "국어 55점→", "78점으로 상승"],
  ["중2 학생", "수학 85점→", "100점으로 상승"],
  ["고3 학생", "영어 5등급→", "3등급으로 상승"],
  ["고1 학생", "수학 69점→", "92점으로 상승"],
];

const teachers = [
  {
    subject: "수학",
    name: "Teacher Noah",
    initial: "N",
    highlight: "전교꼴등에서 서울대학교 입학했어요",
    careers: ["서울대학교 수리과학부", "입시 수학 7년", "최상위권 심화반 운영"],
  },
  {
    subject: "영어",
    name: "Teacher Olivia",
    initial: "O",
    highlight: "읽기 습관만 바꿔도 점수는 달라집니다",
    careers: ["연세대학교 영어영문학과", "국제학교/토플 지도", "첨삭 1,800시간+"],
  },
  {
    subject: "물리",
    name: "Teacher Peter",
    initial: "P",
    highlight: "공식보다 먼저 직관을 세워요",
    careers: ["KAIST 전기및전자공학부", "물리·수학 통합 지도", "STEM 멘토 수상"],
  },
  {
    subject: "국어",
    name: "Teacher Jiwoo",
    initial: "J",
    highlight: "지문을 읽는 규칙을 훈련합니다",
    careers: ["서울대학교 국어국문학과", "논술 전문 프라이빗", "내신 국어 맞춤 관리"],
  },
];

const steps = [
  ["01", "무료 상담 신청", "학생의 현재 성적, 목표, 성향을 간단히 남겨주세요."],
  ["02", "매니저 배정 및 전화 상담", "10년 경력 매니저가 학습 상황과 가족의 우선순위를 듣습니다."],
  ["03", "선생님 추천 및 매칭", "과목, 성향, 일정에 맞는 선생님 후보를 추천합니다."],
  ["04", "수업 시작", "첫 수업 후 적합도를 확인하고 필요한 조정을 진행합니다."],
  ["05", "학습 리포트 & 관리", "진도, 숙제, 질문, 리포트를 한 흐름으로 관리합니다."],
];

const faqs = [
  ["상담은 어떻게 진행되나요?", "상담 신청 후 담당 매니저가 전화로 학생의 현재 수준, 목표, 일정, 성향을 확인합니다."],
  ["선생님 매칭은 얼마나 걸리나요?", "상담 후 보통 1~3일 안에 후보 선생님을 추천드리며, 일정 조율 후 수업을 시작합니다."],
  ["수업 중간에 선생님을 바꿀 수 있나요?", "첫 수업 이후 적합도가 맞지 않으면 매니저와 상의해 다른 선생님으로 조정할 수 있습니다."],
  ["환불 정책이 어떻게 되나요?", "개강 전 취소는 전액 환불되며, 개강 후에는 이용한 수업 횟수를 제외하고 정산합니다."],
];

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
        .find((section) => (section as HTMLElement).offsetTop - 180 <= window.scrollY);

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
  const cardsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const wrapper = wrapperRef.current;
      const cards = cardsRef.current;
      if (!wrapper || !cards) return;

      const rect = wrapper.getBoundingClientRect();
      const scrollable = wrapper.offsetHeight - window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      const maxTranslate = Math.max(cards.scrollWidth - window.innerWidth, 0);
      cards.style.transform = `translateX(${-progress * maxTranslate}px)`;
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

function PricingCard({
  title,
  price,
  active = true,
}: {
  title: string;
  price: string;
  active?: boolean;
}) {
  return (
    <article className={`${active ? "block" : "hidden md:block"} overflow-hidden rounded-[28px] bg-neutral-20`}>
      <div className="h-10 rounded-t-[28px] bg-neutral-20" />
      <div className="relative rounded-t-[28px] bg-neutral-100 p-7 text-white md:p-8">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-bold text-neutral-30">1:1 맞춤 수업</span>
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-black text-white">상담 후 시작</span>
        </div>
        <h3 className="mt-6 text-2xl font-black">{title}</h3>
        <p className="mt-4 text-5xl font-black tracking-tight md:text-6xl">{price}</p>
        <p className="mt-3 text-sm text-neutral-30">학습 관리 · 과제 관리 · 리포트 포함</p>
        <div className="absolute -bottom-3 left-0 flex w-full justify-around">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="h-6 w-6 rounded-full bg-white" />
          ))}
        </div>
      </div>
    </article>
  );
}

export function LandingPage() {
  const { activeTab, showFloating } = useScrollLandingState();
  const { wrapperRef, cardsRef } = useHorizontalScroll();
  const [priceTab, setPriceTab] = useState(0);
  const doubledResults = useMemo(() => [...results, ...results], []);
  const doubledTeachers = useMemo(() => [...teachers, ...teachers], []);

  return (
    <>
      <SiteHeader />
      <main className="bg-white text-neutral-100">
        <section
          id="hero"
          className="relative flex min-h-[100dvh] items-center justify-center px-6 pt-16 text-center md:pt-[100px]"
          style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)" }}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative mx-auto max-w-4xl animate-fade-in">
            <h1 className="whitespace-pre-line text-5xl font-black leading-[1.05] tracking-[-0.04em] text-white sm:text-7xl md:text-8xl">
              {"아이마다 맞는\n선생님이 다릅니다"}
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg font-medium leading-relaxed text-neutral-30 md:text-xl">
              10년 경력의 매니저가 직접 상담하고, 우리 아이에게 꼭 맞는 선생님을 찾아드립니다.
            </p>
          </div>
        </section>

        <nav className="sticky top-16 z-40 border-b border-neutral-20 bg-white md:top-[100px]">
          <div className="scrollbar-hide mx-auto flex max-w-[1200px] overflow-x-auto px-5">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className={`relative shrink-0 px-5 py-4 text-sm transition md:px-7 ${
                  activeTab === tab.id ? "font-black text-primary" : "font-bold text-neutral-50"
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

        <section id="intro" className="overflow-hidden bg-neutral-90 py-24 text-white md:py-32">
          <div className="mx-auto max-w-[1200px] px-5">
            <h2 className="text-4xl font-black leading-tight tracking-[-0.03em] md:text-6xl">
              <span className="text-primary">결과로 증명</span>합니다
            </h2>
          </div>
          <div className="animation-container mt-14 overflow-hidden">
            <div className="animate-slide flex w-max gap-5 px-5 [--speed:26s]">
              {doubledResults.map(([student, before, after], index) => (
                <article
                  key={`${student}-${index}`}
                  className="w-[280px] shrink-0 overflow-hidden rounded-[28px] border border-neutral-20 bg-white text-neutral-100 md:w-[340px]"
                >
                  <div className="flex h-44 items-center justify-center bg-gradient-to-br from-primary/90 to-accent/80 p-6 text-center text-3xl font-black text-white">
                    RESULT
                  </div>
                  <div className="p-6">
                    <p className="text-sm font-bold text-neutral-50">{student}</p>
                    <p className="mt-4 text-2xl font-black leading-snug">
                      {before}
                      <span className="text-primary">{after}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="teachers" className="overflow-hidden bg-neutral-100 py-24 text-white md:py-32">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="lg:sticky lg:top-40 lg:self-start">
              <h2 className="whitespace-pre-line text-4xl font-black leading-tight tracking-[-0.03em] md:text-6xl">
                {"명문대 출신부터\n"}
                <span className="text-primary">경력 5년 이상 전문가</span>
                {"까지\n나만의 선생님으로"}
              </h2>
            </div>
            <div className="overflow-hidden">
              <div className="animate-slide flex w-max gap-5 [--speed:30s]">
                {doubledTeachers.map((teacher, index) => (
                  <article
                    key={`${teacher.name}-${index}`}
                    className="w-[300px] shrink-0 rounded-[28px] border border-neutral-80 bg-neutral-90 p-6 md:w-[360px]"
                  >
                    <span className="rounded-full border border-neutral-80 px-4 py-1.5 text-sm font-bold text-white">
                      {teacher.subject}
                    </span>
                    <h3 className="mt-5 text-2xl font-black">{teacher.name} 선생님</h3>
                    <div className="mx-auto mt-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-5xl font-black">
                      {teacher.initial}
                    </div>
                    <p className="mt-7 text-2xl font-black leading-snug">
                      {teacher.highlight.split(" ").slice(0, -2).join(" ")}{" "}
                      <span className="text-primary">{teacher.highlight.split(" ").slice(-2).join(" ")}</span>
                    </p>
                    <ul className="mt-8 space-y-3 text-sm font-medium text-neutral-30">
                      {teacher.careers.map((career) => (
                        <li key={career} className="flex gap-2">
                          <span className="text-primary">·</span>
                          {career}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="management" className="bg-neutral-10 py-24 md:py-32">
          <div className="mx-auto grid max-w-[1200px] gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-black text-primary">LEARNING CARE</p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.03em] md:text-6xl">
                수업 밖에서도
                <br />
                이어지는 학습 관리
              </h2>
              <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-neutral-50">
                진도, 숙제, 질문, 리포트를 한 화면에서 연결해 학생·선생님·매니저가 같은 목표를 봅니다.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {["진도 관리", "질문 관리", "리포트"].map((item, index) => (
                <div key={item} className="rounded-[28px] bg-white p-6 shadow-sm">
                  <p className="text-5xl font-black text-primary">0{index + 1}</p>
                  <h3 className="mt-8 text-xl font-black">{item}</h3>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-50">
                    매주 필요한 행동을 명확하게 정리합니다.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="bg-neutral-90 py-24 text-white md:py-32">
          <div className="mx-auto max-w-[1200px] px-5">
            <h2 className="text-4xl font-black tracking-[-0.03em] md:text-6xl">이렇게 진행됩니다</h2>
            <p className="mt-5 max-w-2xl text-lg font-medium text-neutral-30">
              상담부터 매칭, 수업까지 1:1로 학생의 성장에 집중해요.
            </p>
          </div>
          <div ref={wrapperRef} className="relative mt-14 h-[3100px] md:h-[2500px]">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
              <div ref={cardsRef} className="flex gap-5 px-5 transition-transform duration-100 will-change-transform">
                {steps.map(([number, title, desc], index) => (
                  <article
                    key={number}
                    className="w-[300px] shrink-0 rounded-[28px] border border-neutral-80 bg-neutral-100 p-5 md:w-[420px] md:p-7"
                  >
                    <div className="h-[190px] rounded-[24px] bg-gradient-to-br from-primary/80 to-neutral-80" />
                    <span className="mt-6 inline-flex rounded-full bg-primary px-4 py-1.5 text-sm font-black text-white">
                      {number}
                    </span>
                    <h3 className="mt-5 text-2xl font-black">{title}</h3>
                    <p className="mt-4 text-sm font-medium leading-relaxed text-neutral-30">{desc}</p>
                    <p className="mt-10 text-7xl font-black text-white/5">0{index + 1}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white py-24 md:py-32">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-black text-primary">PRICE</p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.03em] md:text-6xl">
                1:1 맞춤 과외,
                <br />월 40만원부터
              </h2>
            </div>
            <div>
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
              <div className="grid gap-6 md:grid-cols-2">
                <PricingCard title="월 4회" price="400,000원" active={priceTab === 0} />
                <PricingCard title="월 8회" price="720,000원" active={priceTab === 1} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary py-20 text-white md:py-28">
          <div className="mx-auto max-w-[1200px] px-5">
            <h2 className="text-4xl font-black tracking-[-0.03em] md:text-6xl">
              지금 신청하면 받을 수 있는 혜택이에요
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {["무료 상담 1회", "매니저 직접 배정", "학습 리포트 무료 제공"].map((benefit) => (
                <div key={benefit} className="rounded-[28px] bg-white/15 p-7 backdrop-blur">
                  <p className="text-2xl font-black">{benefit}</p>
                  <p className="mt-4 text-sm font-medium text-white/80">첫 상담부터 수업 후 관리까지 이어집니다.</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="bg-white py-24 md:py-32">
          <div className="mx-auto max-w-[1200px] space-y-8 px-5">
            {[
              ["아이가 처음으로 공부 계획을 직접 설명했어요. 선생님 매칭보다 매니저 상담이 먼저라 훨씬 안심됐습니다.", "고2 수학 · 학부모"],
              ["수업 후 리포트가 있어서 무엇을 복습해야 하는지 분명했습니다. 성적보다 습관이 먼저 바뀌었어요.", "중3 영어 · 학생"],
            ].map(([quote, info], index) => (
              <article
                key={info}
                className="grid overflow-hidden rounded-[32px] border border-neutral-20 bg-neutral-10 md:grid-cols-[1fr_320px]"
              >
                <div className="p-8 md:p-12">
                  <svg width="48" height="38" viewBox="0 0 48 38" fill="none" className="text-primary">
                    <path d="M18.5 0C7.8 5.1 1.7 12.8 0 23.1C-1.1 31.1 3.3 37.3 10.9 37.3C16.2 37.3 20.1 33.7 20.1 28.6C20.1 24 17.1 20.7 12.5 20.1C14 14.9 17.5 10.9 23 8L18.5 0ZM43.2 0C32.5 5.1 26.4 12.8 24.7 23.1C23.6 31.1 28 37.3 35.6 37.3C40.9 37.3 44.8 33.7 44.8 28.6C44.8 24 41.8 20.7 37.2 20.1C38.7 14.9 42.2 10.9 47.7 8L43.2 0Z" fill="currentColor" />
                  </svg>
                  <p className="mt-8 text-2xl font-black leading-relaxed md:text-3xl">{quote}</p>
                  <p className="mt-8 text-sm font-bold text-neutral-50">{info}</p>
                </div>
                <div className="flex min-h-[260px] items-center justify-center bg-gradient-to-br from-primary/80 to-accent/70 text-6xl font-black text-white">
                  {index + 1}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="bg-neutral-80 py-24 text-white md:py-32">
          <div className="mx-auto max-w-[900px] px-5">
            <h2 className="text-4xl font-black md:text-6xl">자주 묻는 질문</h2>
            <div className="mt-10 divide-y divide-neutral-50/30 rounded-[28px] border border-neutral-50/30">
              {faqs.map(([q, a], index) => (
                <div key={q} className="relative">
                  <input id={`faq-${index}`} type="checkbox" className="faq-toggle peer sr-only" />
                  <label htmlFor={`faq-${index}`} className="faq-header flex cursor-pointer items-center justify-between gap-4 p-6">
                    <span className="text-lg font-black">Q. {q}</span>
                    <span className="chevron-icon text-primary transition-transform">⌄</span>
                  </label>
                  <div className="content-wrapper grid">
                    <div className="faq-content overflow-hidden">
                      <p className="px-6 pb-6 text-sm font-medium leading-relaxed text-neutral-30">{a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-24 text-center md:py-32">
          <div className="mx-auto max-w-[1000px] px-5">
            <p className="text-4xl font-black italic text-neutral-100">Concord.</p>
            <h2 className="mx-auto mt-8 max-w-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl font-black leading-tight tracking-[-0.03em] text-transparent md:text-6xl">
              학생들에게 꼭 필요한 수업을 제공합니다
            </h2>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                ["누적 상담", "500+"],
                ["매칭 완료", "1,200+"],
                ["학생 만족도", "98%"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="bg-gradient-to-r from-primary to-accent bg-clip-text text-6xl font-black text-transparent">
                    {value}
                  </p>
                  <p className="mt-3 text-sm font-black text-neutral-50">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-neutral-20 bg-white">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <div className="grid gap-10 border-b border-neutral-20 pb-12 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-black">상담이 필요하신가요?</h2>
                <p className="mt-4 text-sm font-medium leading-relaxed text-neutral-50">
                  채팅문의 10:00~22:00 · 전화문의 평일 10:00~19:00
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/dashboard/consultation" className="rounded-full bg-primary px-5 py-3 text-sm font-black text-white">
                    채팅 문의
                  </Link>
                  <a href="tel:010-0000-0000" className="rounded-full border border-neutral-20 px-5 py-3 text-sm font-black">
                    전화 문의
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 text-sm font-bold text-neutral-50">
                <div className="space-y-3">
                  <p className="text-neutral-100">서비스</p>
                  <Link href="/tutors" className="block hover:text-primary">강사진</Link>
                  <Link href="/pricing" className="block hover:text-primary">요금제</Link>
                  <Link href="/dashboard/consultation" className="block hover:text-primary">상담 신청</Link>
                </div>
                <div className="space-y-3">
                  <p className="text-neutral-100">SNS</p>
                  <a href="https://instagram.com" className="block hover:text-primary">Instagram</a>
                  <a href="https://youtube.com" className="block hover:text-primary">YouTube</a>
                  <a href="https://blog.naver.com" className="block hover:text-primary">Blog</a>
                </div>
              </div>
            </div>
            <div className="relative pt-8 text-xs font-medium leading-relaxed text-neutral-40">
              <p>
                상호 주식회사 컨코드에듀케이션 | 대표 홍길동 | 사업자등록번호 123-45-67890 | 주소 서울특별시 강남구 테헤란로 000
              </p>
              <p className="mt-2">이용약관 | 개인정보처리방침 | 환불정책</p>
              <p className="mt-6">© {new Date().getFullYear()} Concord Private Tutoring. All rights reserved.</p>
              <Link href="/teacher-portal" className="mt-6 block text-right text-[11px] text-neutral-40 hover:text-primary">
                선생님이신가요?
              </Link>
            </div>
          </div>
        </footer>
      </main>

      <Link
        href="/dashboard/consultation"
        className={`fixed bottom-6 right-6 z-50 rounded-full bg-primary px-6 py-4 text-sm font-black text-white shadow-2xl transition duration-300 ${
          showFloating ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        무료 상담 신청
      </Link>
    </>
  );
}
