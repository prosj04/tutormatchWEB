"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import type { LandingCmsContent } from "@/lib/cms";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  formatCmsMultiline,
  parseCmsVisibility,
} from "@/lib/cms-page-defaults";
import { buildVisiblePricingPlanItems } from "@/lib/pricing-cms";
import { usePricingSchoolTier } from "@/lib/pricing-tier-preference";
import { RESULT_CARD_IMAGES } from "@/lib/result-card-images";
import { portalHomeHref } from "@/lib/portal-roles";

/* ─── static data (same as LandingPage) ─── */
const DEFAULT_RESULT_IMAGES = [...RESULT_CARD_IMAGES];

const stats = [
  { value: "500+", label: "누적 상담" },
  { value: "1,200+", label: "매칭 완료" },
  { value: "98%", label: "학생 만족도" },
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
  { subject: "수학", name: "Teacher Noah", image: "/images/teachers/default-male.png", highlight: "전교 꼴등에서 서울대학교 입학했어요", careers: ["서울대학교 수리과학부", "입시 수학 7년", "최상위권 심화반 운영"] },
  { subject: "영어", name: "Teacher Olivia", image: "/images/teachers/default-female.png", highlight: "읽기 습관만 바꿔도 점수는 달라집니다", careers: ["연세대학교 영어영문학과", "국제학교·토플 지도", "첨삭 1,800시간+"] },
  { subject: "물리", name: "Teacher Peter", image: "/images/teachers/default-male.png", highlight: "공식보다 먼저 직관을 세워요", careers: ["KAIST 전기및전자공학부", "물리·수학 통합 지도", "STEM 멘토 수상"] },
  { subject: "국어", name: "Teacher Jiwoo", image: "/images/teachers/default-female.png", highlight: "지문을 읽는 규칙을 훈련합니다", careers: ["서울대학교 국어국문학과", "논술 전문 프라이빗", "내신 국어 맞춤 관리"] },
];

const steps = [
  { number: "01", title: "무료 상담 신청", desc: "학생의 현재 성적, 목표, 성향을 간단히 남겨주세요." },
  { number: "02", title: "매니저 배정·전화 상담", desc: "10년 경력 매니저가 학습 상황과 가족의 우선순위를 듣습니다." },
  { number: "03", title: "선생님 추천·매칭", desc: "과목, 성향, 일정에 맞는 선생님 후보를 추천합니다." },
  { number: "04", title: "수업 시작", desc: "첫 수업 후 적합도를 확인하고 필요한 조정을 진행합니다." },
  { number: "05", title: "학습 리포트·관리", desc: "진도, 숙제, 질문, 리포트를 한 흐름으로 관리합니다." },
];

const compareRows = [
  { label: "선생님 자격 검증", general: "없음", concord: "서류·면접 인증" },
  { label: "선생님 실력 확인", general: "수업 후에야 파악", concord: "사전 검증" },
  { label: "학생 맞춤 매칭", general: "직접 알아봐야 함", concord: "성향·과목 맞춤" },
  { label: "선생님 교체 리스크", general: "안 맞으면 1~2달 낭비", concord: "처음부터 핏 맞는 선생님" },
  { label: "매일 학습 점검", general: "없음", concord: "일별 플랜" },
  { label: "질문 답변", general: "수업 시간에만", concord: "상시 (강사·AI)" },
  { label: "문제 발생 대응", general: "학부모가 직접 해결", concord: "전담 매니저 조율" },
];

/* ─── scroll-reveal hook ─── */
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("th-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll(".th-reveal").forEach((el) => io.observe(el));
    const timer = setTimeout(() => {
      document.querySelectorAll(".th-reveal:not(.th-in)").forEach((el) => el.classList.add("th-in"));
    }, 2500);
    return () => { io.disconnect(); clearTimeout(timer); };
  }, []);
}

/* ─── themed header ─── */
function ThemedHeader({ showFaqLink }: { showFaqLink: boolean }) {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const logoHref = portalHomeHref(session?.user?.role);
  const role = session?.user?.role;
  const name = session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "회원";
  const portalHref = role === "ADMIN" ? "/admin" : role === "TEACHER" || role === "MANAGER" ? "/teacher-portal/dashboard" : "/dashboard";
  const portalLabel = role === "ADMIN" ? "관리자" : role === "TEACHER" || role === "MANAGER" ? "선생님 포털" : "내 학습";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/tutors", label: "강사진" },
    { href: "/pricing", label: "요금제" },
    { href: "/reviews", label: "학습후기" },
    { href: "/#compare", label: "비교하기" },
    ...(showFaqLink ? [{ href: "/faq", label: "FAQ" }] : []),
  ];

  return (
    <header
      className="fixed left-0 top-0 z-50 w-full transition-all duration-300"
      style={{
        background: scrolled || open ? "var(--th-header-bg)" : "transparent",
        backdropFilter: scrolled || open ? "saturate(140%) blur(14px)" : "none",
        borderBottom: `1px solid ${scrolled ? "var(--th-line)" : "transparent"}`,
      }}
    >
      <div className="mx-auto flex h-[70px] max-w-[1280px] items-center justify-between gap-4 px-6 md:px-8">
        {/* Logo */}
        <Link href={logoHref} className="shrink-0 text-xl font-black tracking-[-0.03em]" style={{ color: "var(--th-fg)" }}>
          Concord<span style={{ color: "var(--th-acc)" }}>.</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-xl px-3 py-2 text-sm font-semibold transition-colors" style={{ color: "var(--th-mut)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--th-fg)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--th-mut)")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-full" style={{ background: "var(--th-panel-2)" }} />
          ) : status === "authenticated" && session?.user ? (
            <>
              <span className="hidden text-sm font-semibold lg:inline" style={{ color: "var(--th-mut)" }}>{name}님</span>
              <Link href={portalHref} className="rounded-full border px-4 py-2 text-sm font-bold transition"
                style={{ borderColor: "var(--th-line-2)", color: "var(--th-fg)", background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--th-fg)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--th-line-2)")}
              >{portalLabel}</Link>
              <button type="button" onClick={() => void signOut({ redirectTo: "/" })}
                className="rounded-full px-4 py-2 text-sm font-bold transition"
                style={{ background: "var(--th-fg)", color: "var(--th-bg)" }}
              >로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold transition" style={{ color: "var(--th-mut)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--th-fg)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--th-mut)")}
              >로그인</Link>
              <ConsultationApplyButton
                className="rounded-full px-5 py-2 text-sm font-bold transition"
                style={{ background: "var(--th-acc)", color: "var(--th-on-acc)" } as React.CSSProperties}
              >상담 신청</ConsultationApplyButton>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button type="button" onClick={() => setOpen((p) => !p)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition md:hidden"
          style={{ borderColor: "var(--th-line-2)", color: "var(--th-fg)" }}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        >
          {open ? <span className="text-2xl leading-none">×</span> : (
            <span className="space-y-1.5"><span className="block h-0.5 w-5 bg-current" /><span className="block h-0.5 w-5 bg-current" /><span className="block h-0.5 w-5 bg-current" /></span>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`fixed inset-x-0 bottom-0 top-[70px] z-[60] overflow-y-auto transition-transform duration-300 md:hidden ${open ? "translate-x-0" : "pointer-events-none translate-x-full"}`}
        style={{ background: "var(--th-panel)" }}
      >
        <div className="flex min-h-full flex-col justify-between gap-6 px-5 py-8">
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className="flex min-h-[48px] items-center rounded-2xl px-4 text-2xl font-black transition"
                style={{ color: "var(--th-fg)" }}
              >{link.label}</Link>
            ))}
          </nav>
          <div className="space-y-4">
            <ThemeToggle className="w-full justify-center" />
            {status === "authenticated" && session?.user ? (
              <div className="space-y-2">
                <Link href={portalHref} onClick={() => setOpen(false)}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-full border text-base font-bold"
                  style={{ borderColor: "var(--th-line-2)", color: "var(--th-fg)" }}
                >{portalLabel}</Link>
                <button type="button" onClick={() => void signOut({ redirectTo: "/" })}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-full text-base font-bold"
                  style={{ background: "var(--th-fg)", color: "var(--th-bg)" }}
                >로그아웃</button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" onClick={() => setOpen(false)}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-full border text-base font-bold"
                  style={{ borderColor: "var(--th-line-2)", color: "var(--th-fg)" }}
                >로그인</Link>
                <ConsultationApplyButton
                  className="flex min-h-[48px] w-full items-center justify-center rounded-full text-base font-bold"
                  style={{ background: "var(--th-acc)", color: "var(--th-on-acc)" } as React.CSSProperties}
                >상담 신청</ConsultationApplyButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── main component ─── */
export function LandingPageThemed({
  cms,
}: {
  cms?: LandingCmsContent;
  isEditMode?: boolean;
}) {
  useReveal();
  const [pricingTier] = usePricingSchoolTier();

  const getCmsValue = (section: string, key: string, fallback: string) =>
    cms?.siteContent[section]?.[key] ?? fallback;
  const getCmsMultiline = (section: string, key: string, fallback: string) =>
    formatCmsMultiline(getCmsValue(section, key, fallback));

  /* ── processed data (same as LandingPage) ── */
  const cmsStats = [
    { value: getCmsValue("stats", "stat1_number", stats[0].value), label: getCmsValue("stats", "stat1_label", stats[0].label) },
    { value: getCmsValue("stats", "stat2_number", stats[1].value), label: getCmsValue("stats", "stat2_label", stats[1].label) },
    { value: getCmsValue("stats", "stat3_number", stats[2].value), label: getCmsValue("stats", "stat3_label", stats[2].label) },
  ];

  const cmsResults = results.flatMap(([student, before, after], index) => {
    const n = index + 1;
    const vis = getCmsValue("results", `result${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) return [];
    return [{ student: getCmsValue("results", `result${n}_student`, student), before: getCmsValue("results", `result${n}_before`, before), after: getCmsValue("results", `result${n}_after`, after), image: getCmsValue("results", `result${n}_image`, DEFAULT_RESULT_IMAGES[index] ?? DEFAULT_RESULT_IMAGES[0]) }];
  });
  const doubledResults = cmsResults.length > 0 ? [...cmsResults, ...cmsResults] : [];

  const cmsTeachers = teachers.flatMap((t, index) => {
    const n = index + 1;
    const vis = getCmsValue("teachers", `teacher${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis)) return [];
    const careers = getCmsValue("teachers", `teacher${n}_careers`, t.careers.join("\n")).split("\n").map((c) => c.trim()).filter(Boolean);
    return [{ subject: getCmsValue("teachers", `teacher${n}_subject`, t.subject), name: getCmsValue("teachers", `teacher${n}_name`, t.name), image: getCmsValue("teachers", `teacher${n}_image`, t.image), highlight: getCmsValue("teachers", `teacher${n}_highlight`, t.highlight), careers: careers.length > 0 ? careers : t.careers }];
  });

  const cmsSteps = steps.flatMap((step, index) => {
    const n = index + 1;
    const vis = getCmsValue("features", `step${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, n <= 5)) return [];
    return [{ ...step, title: getCmsValue("features", `step${n}_title`, step.title), desc: getCmsMultiline("features", `step${n}_desc`, step.desc) }];
  });

  const managementItems = [1, 2, 3].flatMap((n) => {
    const vis = getCmsValue("management", `item${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) return [];
    const defaults: Record<number, { label: string; desc: string }> = {
      1: { label: "진도 관리", desc: "주간 진도와 목표 달성률을 매니저·가정과 공유합니다." },
      2: { label: "질문 관리", desc: "복습 질문에 대한 즉각 피드백으로 자기주도 학습을 돕습니다." },
      3: { label: "리포트", desc: "월간 학습 데이터와 취약 유형 분석을 리포트로 제공합니다." },
    };
    const d = defaults[n]!;
    return [{ n, label: getCmsValue("management", `item${n}_title`, d.label), desc: getCmsMultiline("management", `item${n}_desc`, d.desc) }];
  });

  const cmsTestimonials = cms && cms.testimonials.length > 0 ? cms.testimonials.slice(0, 3) : [
    { quote: "공부하러 가서도 시간만 보내던 아이가 처음으로 공부 계획을 직접 잡고 실행했어요. 정말 아이에 맞는 선생님을 찾아주셔서 안심됐습니다.", info: "고2 수학 · 학부모", img: "" },
    { quote: "방황하는 아들의 방향을 잡아 줄 선생님이 필요했는데, 정확히 맞는 분을 찾아줬어요. 아이가 선생님처럼 되고 싶다며 열심히 합니다.", info: "고3 수학 · 학부모", img: "" },
    { quote: "숙제와 공부 계획을 등록하고 선생님이랑 같이 점검하니 자연스럽게 매일 공부하게 됐어요. 성적보다 습관이 먼저 바뀌었어요.", info: "중3 영어 · 학생", img: "" },
  ];

  const homePricingItems = useMemo(() => {
    const all = buildVisiblePricingPlanItems(cms?.siteContent, pricingTier);
    const picked = all.filter((_, i) => i === 0 || i === 2);
    return picked.length >= 2 ? picked : all.slice(0, 2);
  }, [cms?.siteContent, pricingTier]);

  const showFaqPage = true;

  const footerCopyright = getCmsValue("footer", "copyright", "© {year} Concord Private Tutoring. All rights reserved.").replace("{year}", String(new Date().getFullYear()));

  /* shared style helpers */
  const S = {
    bg: { background: "var(--th-bg)" } as React.CSSProperties,
    panel: { background: "var(--th-panel)" } as React.CSSProperties,
    panel2: { background: "var(--th-panel-2)" } as React.CSSProperties,
    fg: { color: "var(--th-fg)" } as React.CSSProperties,
    mut: { color: "var(--th-mut)" } as React.CSSProperties,
    mut2: { color: "var(--th-mut-2)" } as React.CSSProperties,
    acc: { color: "var(--th-acc-text)" } as React.CSSProperties,
    border: { borderColor: "var(--th-line)" } as React.CSSProperties,
    border2: { borderColor: "var(--th-line-2)" } as React.CSSProperties,
  };

  const secPad = "py-[clamp(5rem,8.5vw,10.5rem)]";
  const wrap = "mx-auto w-full max-w-[1280px] px-5 md:px-8";
  const eyebrow = "text-[13px] font-bold tracking-[.22em] uppercase";
  const secH2 = "text-[clamp(2rem,4.4vw,4rem)] font-black leading-[1.08] tracking-[-0.03em] mt-4";

  return (
    <div style={S.bg}>
      <ThemedHeader showFaqLink={showFaqPage} />

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-[70px]" style={S.bg}>
        {/* radial gradient glow */}
        <div className="pointer-events-none absolute inset-0 z-0" style={{
          background: `radial-gradient(680px 420px at 78% -8%, rgba(var(--th-acc-rgb),.15), transparent 60%), radial-gradient(540px 380px at 8% 12%, rgba(var(--th-acc-rgb),.05), transparent 60%)`,
        }} />
        {/* grid pattern */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-40" style={{
          backgroundImage: `linear-gradient(var(--th-line) 1px, transparent 1px), linear-gradient(90deg, var(--th-line) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          WebkitMaskImage: "radial-gradient(900px 600px at 70% 0%, #000, transparent 75%)",
          maskImage: "radial-gradient(900px 600px at 70% 0%, #000, transparent 75%)",
        }} />

        <div className={`${wrap} relative z-10 ${secPad}`}>
          <span className={`${eyebrow}`} style={S.acc}>Concord Private Tutoring</span>
          <h1 className="mt-6 max-w-[13ch] text-[clamp(2.8rem,7.4vw,7.5rem)] font-black leading-[1.04] tracking-[-0.04em]" style={S.fg}>
            학생마다 맞는 <span style={S.acc}>선생님</span>이 다릅니다
          </h1>
          <p className="mt-8 max-w-[50ch] text-[clamp(1rem,1.55vw,1.4rem)] leading-[1.55]" style={S.mut}>
            {getCmsValue("hero", "subtext", "전문 매니저가 직접 상담하고, 우리 아이에게 꼭 맞는 선생님을 찾아드립니다.")}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ConsultationApplyButton
              className="inline-flex items-center justify-center rounded-full px-7 py-4 text-base font-bold transition hover:-translate-y-0.5"
              style={{ background: "var(--th-acc)", color: "var(--th-on-acc)" } as React.CSSProperties}
            >무료 상담 신청</ConsultationApplyButton>
            <Link href="/tutors"
              className="inline-flex items-center justify-center rounded-full border px-7 py-4 text-base font-bold transition hover:-translate-y-0.5"
              style={{ borderColor: "var(--th-line-2)", color: "var(--th-fg)", background: "transparent" }}
            >선생님 둘러보기 →</Link>
          </div>

          {/* stats */}
          <div className="mt-20 flex flex-wrap border-t" style={S.border}>
            {cmsStats.map((s) => (
              <div key={s.label} className="mr-10 border-r pr-10 py-8 last:border-r-0" style={S.border}>
                <div className="text-[clamp(2.2rem,4.6vw,4.2rem)] font-black leading-none tracking-[-0.03em] tabular-nums" style={S.fg}>
                  {s.value.replace(/(\d+)([+%])/, (_, n) => n).includes("+") || s.value.includes("%")
                    ? <>{s.value.replace(/[+%].*/, "")}<span style={S.acc}>{s.value.replace(/[^+%]*/, "")}</span></>
                    : <>{s.value.slice(0, -1)}<span style={S.acc}>{s.value.slice(-1)}</span></>
                  }
                </div>
                <div className="mt-2.5 text-sm font-medium" style={S.mut}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ RESULTS MARQUEE ═══════════════════════════════ */}
      <div className="overflow-hidden border-y" style={{ ...S.panel, borderColor: "var(--th-line)" }}>
        <div className="flex gap-3.5 whitespace-nowrap py-5 motion-safe:animate-slide-left [--speed:38s]">
          {doubledResults.map((item, i) => (
            <span key={i} className="inline-flex shrink-0 items-center gap-3 rounded-full border px-5 py-3 text-sm font-semibold"
              style={{ background: "var(--th-panel-2)", borderColor: "var(--th-line)" }}
            >
              <span style={S.mut}>{item.student}</span>
              {item.before}<span className="font-black" style={S.acc}>→ {item.after}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ TEACHERS ══════════════════════════════════════ */}
      <section id="teachers" className={`${secPad} scroll-mt-20`} style={S.bg}>
        <div className={wrap}>
          <div className="th-reveal">
            <span className={`${eyebrow}`} style={S.acc}>Teachers</span>
            <h2 className={secH2} style={S.fg}>명문대 출신부터<br />경력 10년 이상 전문가까지</h2>
            <p className="mt-5 max-w-[56ch] text-[clamp(1rem,1.3vw,1.2rem)]" style={S.mut}>
              {getCmsValue("teachers", "section_subtext", "확실한 서류 인증과 채용 절차로 엄선된, 인품과 실력 모두 확실한 선생님을 배정해드립니다.")}
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cmsTeachers.map((t, i) => (
              <article key={`${t.name}-${i}`} className="th-reveal flex flex-col overflow-hidden rounded-[18px] border transition-transform duration-[250ms] hover:-translate-y-1.5"
                style={{ background: "var(--th-panel)", borderColor: "var(--th-line)" }}
              >
                {/* photo */}
                <div className="relative aspect-[4/3] border-b"
                  style={{ background: `repeating-linear-gradient(135deg, var(--th-stripe-a) 0 11px, var(--th-stripe-b) 11px 22px)`, borderColor: "var(--th-line)" }}
                >
                  <Image src={t.image} alt={t.name} fill className="object-cover object-top" sizes="320px" />
                  <span className="absolute left-3.5 top-3.5 rounded-full px-3 py-1 text-xs font-bold"
                    style={{ background: "var(--th-acc)", color: "var(--th-on-acc)" }}
                  >{t.subject}</span>
                </div>
                {/* body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-[17px] font-bold tracking-[-0.02em]" style={S.fg}>{t.name} 선생님</div>
                  <p className="mt-2 text-sm leading-[1.5]" style={S.mut}>{t.highlight}</p>
                  <div className="mt-4 border-t pt-4" style={S.border}>
                    <ul className="space-y-1.5">
                      {t.careers.map((c) => (
                        <li key={c} className="flex items-center gap-2 text-[13px]" style={S.mut}>
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--th-acc-text)" }} />{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="th-reveal mt-10">
            <Link href="/tutors" className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-bold transition hover:-translate-y-0.5"
              style={{ borderColor: "var(--th-line-2)", color: "var(--th-fg)" }}
            >전체 선생님 보기 →</Link>
          </div>
        </div>
      </section>

      {/* ══ LEARNING CARE ═════════════════════════════════ */}
      <section id="management" className={`${secPad} scroll-mt-20`} style={S.panel}>
        <div className={wrap}>
          <div className="th-reveal">
            <span className={eyebrow} style={S.acc}>Learning Care</span>
            <h2 className={secH2} style={S.fg}>수업 밖에서도 이어지는 학습 관리</h2>
            <p className="mt-5 max-w-[56ch] text-[clamp(1rem,1.3vw,1.2rem)]" style={S.mut}>
              {getCmsValue("management", "subtext", "진도, 숙제, 질문, 리포트를 한 화면에서 연결해 학생·선생님·매니저가 같은 목표를 봅니다.")}
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {managementItems.map((item) => (
              <div key={item.n} className="th-reveal rounded-[18px] border p-8 transition-transform duration-[250ms] hover:-translate-y-1"
                style={{ borderColor: "var(--th-line)" }}
              >
                <div className="text-sm font-black tracking-[.1em]" style={S.acc}>0{item.n}</div>
                <h3 className="mt-5 text-xl font-bold tracking-[-0.025em]" style={S.fg}>{item.label}</h3>
                <p className="mt-3 text-[15px] leading-[1.6]" style={S.mut}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PROCESS ═══════════════════════════════════════ */}
      <section id="process" className={`${secPad} scroll-mt-20`} style={S.bg}>
        <div className={wrap}>
          <div className="th-reveal">
            <span className={eyebrow} style={S.acc}>Process</span>
            <h2 className={secH2} style={S.fg}>이렇게 진행됩니다</h2>
            <p className="mt-5 max-w-[56ch] text-[clamp(1rem,1.3vw,1.2rem)]" style={S.mut}>
              상담부터 매칭, 수업까지 1:1로 학생의 성장에 집중해요.
            </p>
          </div>

          <div className="mt-12">
            {cmsSteps.map((step, i) => (
              <div key={step.number} className="th-reveal group grid grid-cols-[80px_1fr] gap-6 border-t py-8 transition-[padding-left] duration-[250ms] hover:pl-4 md:grid-cols-[120px_1fr] md:gap-10 last:border-b"
                style={S.border}
              >
                <div className="text-[clamp(2.5rem,4.2vw,4.2rem)] font-black leading-none tracking-[-0.03em] tabular-nums transition-colors" style={{ color: i === 0 ? "var(--th-acc-text)" : "var(--th-mut-2)" }}>
                  {step.number}
                </div>
                <div className="self-start pt-1">
                  <h3 className="text-xl font-bold tracking-[-0.025em] md:text-2xl" style={S.fg}>{step.title}</h3>
                  <p className="mt-2.5 max-w-[54ch] text-[15px] leading-[1.65]" style={S.mut}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ═══════════════════════════════════════ */}
      <section id="pricing" className={`${secPad} scroll-mt-20`} style={S.panel}>
        <div className={wrap}>
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <div className="th-reveal lg:self-center">
              <span className={eyebrow} style={S.acc}>Plans</span>
              <h2 className={secH2} style={S.fg}>
                1:1 맞춤 과외, <span style={S.acc}>{getCmsValue("home_page", "pricing_title", "월 40만원부터").split("\n").pop()}</span>
              </h2>
              <p className="mt-5 max-w-[42ch] text-[clamp(1rem,1.3vw,1.2rem)]" style={S.mut}>
                {getCmsValue("home_page", "pricing_subtext", "모든 플랜에 학습 관리와 강사 첨삭이 포함됩니다.")}
              </p>
              <Link href="/pricing" className="mt-8 inline-flex items-center rounded-full border px-6 py-3 text-sm font-bold transition hover:-translate-y-0.5"
                style={{ borderColor: "var(--th-line-2)", color: "var(--th-fg)" }}
              >요금제 더보기 →</Link>
            </div>

            <div className="th-reveal grid gap-5 sm:grid-cols-2">
              {homePricingItems.map((item, i) => {
                const isRec = i === 1;
                const priceText = item.price ?? item.plan.title;
                const featureList = item.features ?? item.plan.features;
                return (
                  <div key={item.plan.id} className="relative flex flex-col rounded-[22px] border p-8"
                    style={{
                      background: isRec ? `linear-gradient(180deg, rgba(var(--th-acc-rgb),.06), transparent 40%), var(--th-panel)` : "var(--th-panel)",
                      borderColor: isRec ? "var(--th-acc-text)" : "var(--th-line)",
                    }}
                  >
                    {isRec && (
                      <span className="absolute -top-3.5 left-8 rounded-full px-4 py-1.5 text-xs font-bold"
                        style={{ background: "var(--th-acc)", color: "var(--th-on-acc)" }}
                      >추천</span>
                    )}
                    <div className="text-sm font-semibold" style={S.mut}>{item.subtitle ?? item.plan.subtitle}</div>
                    <div className="mt-1 text-2xl font-bold tracking-[-0.025em]" style={S.fg}>{item.title ?? item.plan.title}</div>
                    <div className="mt-5 text-[2.4rem] font-black leading-none tracking-[-0.03em] tabular-nums" style={S.fg}>
                      {priceText.replace(/[^0-9,]/g, "")}<span className="text-lg font-semibold" style={S.mut}>원 / 월</span>
                    </div>
                    <ul className="mt-6 flex-1 space-y-3">
                      {featureList.map((f) => (
                        <li key={f} className="flex gap-2.5 text-sm" style={S.fg}>
                          <span className="shrink-0 font-black" style={S.acc}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                    <ConsultationApplyButton
                      className={`mt-8 w-full rounded-full py-3.5 text-sm font-bold transition hover:-translate-y-0.5 ${isRec ? "" : "border"}`}
                      style={isRec
                        ? { background: "var(--th-acc)", color: "var(--th-on-acc)" } as React.CSSProperties
                        : { borderColor: "var(--th-line-2)", color: "var(--th-fg)", background: "transparent" } as React.CSSProperties
                      }
                    >이 플랜으로 시작</ConsultationApplyButton>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══ COMPARE ═══════════════════════════════════════ */}
      <section id="compare" className={`${secPad} scroll-mt-20`} style={S.bg}>
        <div className={wrap}>
          <div className="th-reveal">
            <span className={eyebrow} style={S.acc}>Compare</span>
            <h2 className={secH2} style={S.fg}>개인 과외와 무엇이 다른가요</h2>
            <p className="mt-5 max-w-[56ch] text-[clamp(1rem,1.3vw,1.2rem)]" style={S.mut}>
              맞지 않는 선생님으로 1~2달을 낭비하지 않도록, 처음부터 핏을 맞춥니다.
            </p>
          </div>

          <div className="th-reveal mt-12 overflow-hidden rounded-[20px] border" style={{ borderColor: "var(--th-line)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-5 text-left text-[13px] font-bold uppercase tracking-[.06em]" style={{ ...S.mut, borderBottom: `1px solid var(--th-line-2)` }}>비교 항목</th>
                  <th className="p-5 text-left text-[13px] font-bold uppercase tracking-[.06em]" style={{ ...S.mut, borderBottom: `1px solid var(--th-line-2)` }}>개인 과외</th>
                  <th className="rounded-t-[14px] p-5 text-left text-[13px] font-bold uppercase tracking-[.06em]"
                    style={{ background: "var(--th-acc)", color: "var(--th-on-acc)", borderBottom: `1px solid var(--th-line-2)` }}
                  >Concord</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr key={row.label}>
                    <td className="p-5 font-semibold" style={{ ...S.fg, borderBottom: i < compareRows.length - 1 ? `1px solid var(--th-line)` : "none" }}>{row.label}</td>
                    <td className="p-5" style={{ ...S.mut, borderBottom: i < compareRows.length - 1 ? `1px solid var(--th-line)` : "none" }}>
                      {row.general === "없음" ? <><span className="mr-2 font-black" style={{ color: "var(--th-mut-2)" }}>✗</span>{row.general}</> : row.general}
                    </td>
                    <td className="p-5 font-semibold" style={{ background: `rgba(var(--th-acc-rgb),.05)`, color: "var(--th-fg)", borderBottom: i < compareRows.length - 1 ? `1px solid var(--th-line)` : "none" }}>
                      <span className="mr-2 font-black" style={S.acc}>✓</span>{row.concord}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══ REVIEWS ═══════════════════════════════════════ */}
      <section id="reviews" className={`${secPad} scroll-mt-20`} style={S.panel}>
        <div className={wrap}>
          <div className="th-reveal">
            <span className={eyebrow} style={S.acc}>Reviews</span>
            <h2 className={secH2} style={S.fg}>성적보다 습관이 먼저 바뀌었어요</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cmsTestimonials.map((t, i) => (
              <div key={i} className="th-reveal flex flex-col rounded-[18px] border p-8"
                style={{ borderColor: "var(--th-line)" }}
              >
                <div className="text-2xl font-black leading-none" style={S.acc}>&ldquo;</div>
                <p className="mt-4 flex-1 text-[15px] leading-[1.65]" style={S.fg}>{t.quote}</p>
                <div className="mt-6 text-sm font-semibold" style={S.mut}>{t.info}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BAND ══════════════════════════════════════ */}
      <section className={`${secPad} scroll-mt-20`} style={S.bg}>
        <div className={wrap}>
          <div className="th-reveal flex flex-wrap items-center justify-between gap-8 rounded-[28px] p-12 md:p-16"
            style={{ background: "var(--th-acc)", color: "var(--th-on-acc)" }}
          >
            <div>
              <h2 className="text-[clamp(1.8rem,3.6vw,2.8rem)] font-black leading-[1.12] tracking-[-0.035em] [white-space:pre-line]">
                {getCmsValue("cta", "headline", "우리 아이에게 맞는 선생님,\n지금 무료로 찾아보세요")}
              </h2>
              <p className="mt-4 text-base font-semibold opacity-75">
                {getCmsValue("cta", "subtext", "무료 상담 1회 · 매니저 직접 배정 · 첫 달 학습 리포트 무료")}
              </p>
            </div>
            <ConsultationApplyButton
              className="shrink-0 rounded-full px-8 py-4 text-base font-bold transition hover:-translate-y-0.5"
              style={{ background: "var(--th-on-acc)", color: "var(--th-acc)" } as React.CSSProperties}
            >무료 상담 신청하기</ConsultationApplyButton>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════ */}
      <footer className="border-t" style={{ ...S.bg, borderColor: "var(--th-line)" }}>
        <div className={`${wrap} py-16`}>
          <div className="flex flex-wrap justify-between gap-10 border-b pb-10" style={S.border}>
            <div>
              <Link href="/" className="text-xl font-black tracking-[-0.03em]" style={S.fg}>
                Concord<span style={S.acc}>.</span>
              </Link>
              <p className="mt-3 text-sm" style={S.mut}>
                {getCmsValue("footer", "hours_chat", "채팅문의 10:00~22:00")} · {getCmsValue("footer", "hours_call", "전화문의 평일 10:00~19:00")}
              </p>
            </div>
            <div className="flex gap-16 text-sm font-semibold">
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[.08em]" style={S.mut2}>서비스</p>
                <Link href="/tutors" className="block transition" style={S.mut} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--th-fg)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--th-mut)")}>강사진</Link>
                <Link href="/pricing" className="block transition" style={S.mut} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--th-fg)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--th-mut)")}>요금제</Link>
                <Link href="/faq" className="block transition" style={S.mut} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--th-fg)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--th-mut)")}>FAQ</Link>
                <ConsultationApplyButton className="block bg-transparent p-0 text-left text-sm font-semibold" style={S.mut}>상담 신청</ConsultationApplyButton>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[.08em]" style={S.mut2}>SNS</p>
                <a href={getCmsValue("footer", "sns_instagram", "https://instagram.com")} target="_blank" rel="noopener noreferrer" className="block transition" style={S.mut} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--th-fg)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--th-mut)")}>Instagram</a>
                <a href={getCmsValue("footer", "sns_youtube", "https://youtube.com")} target="_blank" rel="noopener noreferrer" className="block transition" style={S.mut} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--th-fg)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--th-mut)")}>YouTube</a>
                <a href={getCmsValue("footer", "sns_blog", "https://blog.naver.com")} target="_blank" rel="noopener noreferrer" className="block transition" style={S.mut} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--th-fg)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--th-mut)")}>Blog</a>
              </div>
            </div>
          </div>
          <div className="mt-8 text-xs leading-relaxed" style={S.mut}>
            <p>
              상호 {getCmsValue("footer", "company_name", "주식회사 컨코드에듀케이션")} · 대표 {getCmsValue("footer", "company_rep", "홍길동")} · 사업자등록번호 {getCmsValue("footer", "company_reg", "123-45-67890")}<br />
              주소 {getCmsValue("footer", "company_address", "서울특별시 강남구 테헤란로 000, 00층")}
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              <span>이용약관</span><span>개인정보처리방침</span><span>환불정책</span>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p>{footerCopyright}</p>
              <Link href="/teacher-portal" className="text-[11px] transition" style={S.mut} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--th-fg)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--th-mut)")}>
                {getCmsValue("footer", "label_teacher", "선생님이신가요?")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
