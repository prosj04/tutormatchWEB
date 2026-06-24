"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import type { LandingCmsContent } from "@/lib/cms";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { useDesignTheme } from "@/hooks/useDesignTheme";
import { formatCmsMultiline, parseCmsVisibility } from "@/lib/cms-page-defaults";
import { buildVisiblePricingPlanItems } from "@/lib/pricing-cms";
import { usePricingSchoolTier } from "@/lib/pricing-tier-preference";
import { RESULT_CARD_IMAGES } from "@/lib/result-card-images";
import { portalHomeHref } from "@/lib/portal-roles";

/* ─── static fallback data ─── */
const DEFAULT_RESULT_IMAGES = [...RESULT_CARD_IMAGES];

const stats = [
  { value: "500+", label: "누적 상담" },
  { value: "1,200+", label: "매칭 완료" },
  { value: "98%", label: "학생 만족도" },
];

const results: [string, string, string][] = [
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
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    const timer = setTimeout(() => {
      document.querySelectorAll(".reveal:not(.in)").forEach((el) =>
        el.classList.add("in"),
      );
    }, 2500);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, []);
}

/* ─── SVG icons ─── */
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/* ─── header ─── */
function V2Header({ showFaqLink }: { showFaqLink: boolean }) {
  const { data: session, status } = useSession();
  const { color, mode, setColor, toggleMode } = useDesignTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const logoHref = portalHomeHref(session?.user?.role);
  const role = session?.user?.role;
  const name =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "회원";
  const portalHref =
    role === "ADMIN"
      ? "/admin"
      : role === "TEACHER" || role === "MANAGER"
        ? "/teacher-portal/dashboard"
        : "/dashboard";
  const portalLabel =
    role === "ADMIN"
      ? "관리자"
      : role === "TEACHER" || role === "MANAGER"
        ? "선생님 포털"
        : "내 학습";

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
    <header className={`lp2-header${scrolled || open ? " scrolled" : ""}`}>
      <div className="lp2-wrap">
        <nav className="lp2-nav">
          <Link href={logoHref} className="lp2-logo">
            Concord<span>.</span>
          </Link>

          <div className="lp2-nav-links">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="lp2-nav-right">
            {/* Color picker pill */}
            <div className="lp2-color-picker">
              <button
                type="button"
                className={`lp2-color-btn${color === "green" ? " active" : ""}`}
                onClick={() => setColor("green")}
                aria-label="그린 테마"
              >
                <span className="lp2-color-dot" style={{ background: "#10B981" }} />
              </button>
              <button
                type="button"
                className={`lp2-color-btn${color === "blue" ? " active" : ""}`}
                onClick={() => setColor("blue")}
                aria-label="블루 테마"
              >
                <span className="lp2-color-dot" style={{ background: "#2563EB" }} />
              </button>
            </div>

            {/* Mode toggle */}
            <button
              type="button"
              className="lp2-theme-btn"
              onClick={toggleMode}
              aria-label={mode === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {mode === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Desktop session */}
            <div className="lp2-desktop-session">
              {status === "loading" ? (
                <div
                  style={{
                    width: "80px",
                    height: "36px",
                    borderRadius: "999px",
                    background: "var(--panel-2)",
                  }}
                />
              ) : status === "authenticated" && session?.user ? (
                <>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--mut)",
                    }}
                  >
                    {name}님
                  </span>
                  <Link href={portalHref} className="lp2-btn lp2-btn-ghost lp2-btn-sm">
                    {portalLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={() => void signOut({ redirectTo: "/" })}
                    className="lp2-btn lp2-btn-sm"
                    style={{ background: "var(--fg)", color: "var(--bg)" }}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="lp2-ghost-link">
                    로그인
                  </Link>
                  <ConsultationApplyButton className="lp2-btn lp2-btn-acc lp2-btn-sm">
                    상담 신청
                  </ConsultationApplyButton>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              type="button"
              className="lp2-hamburger"
              onClick={() => setOpen((p) => !p)}
              aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            >
              {open ? (
                <span style={{ fontSize: "22px", lineHeight: 1 }}>×</span>
              ) : (
                <svg
                  width="20"
                  height="16"
                  viewBox="0 0 20 16"
                  fill="currentColor"
                >
                  <rect x="0" y="0" width="20" height="2" rx="1" />
                  <rect x="0" y="7" width="20" height="2" rx="1" />
                  <rect x="0" y="14" width="20" height="2" rx="1" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      <div className={`lp2-mobile-menu${open ? " open" : ""}`}>
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}

        <div className="lp2-mobile-footer">
          {/* Theme controls row */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div className="lp2-color-picker">
              <button
                type="button"
                className={`lp2-color-btn${color === "green" ? " active" : ""}`}
                onClick={() => setColor("green")}
                aria-label="그린 테마"
              >
                <span className="lp2-color-dot" style={{ background: "#10B981" }} />
              </button>
              <button
                type="button"
                className={`lp2-color-btn${color === "blue" ? " active" : ""}`}
                onClick={() => setColor("blue")}
                aria-label="블루 테마"
              >
                <span className="lp2-color-dot" style={{ background: "#2563EB" }} />
              </button>
            </div>
            <button
              type="button"
              className="lp2-theme-btn"
              onClick={toggleMode}
              aria-label={mode === "dark" ? "라이트 모드" : "다크 모드"}
            >
              {mode === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>

          {/* Mobile auth buttons */}
          {status === "authenticated" && session?.user ? (
            <>
              <Link
                href={portalHref}
                onClick={() => setOpen(false)}
                className="lp2-btn lp2-btn-ghost"
                style={{ justifyContent: "center", width: "100%" }}
              >
                {portalLabel}
              </Link>
              <button
                type="button"
                onClick={() => void signOut({ redirectTo: "/" })}
                className="lp2-btn"
                style={{
                  background: "var(--fg)",
                  color: "var(--bg)",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="lp2-btn lp2-btn-ghost"
                style={{ justifyContent: "center", width: "100%" }}
              >
                로그인
              </Link>
              <ConsultationApplyButton
                className="lp2-btn lp2-btn-acc"
                style={{ width: "100%", justifyContent: "center" } as React.CSSProperties}
              >
                상담 신청
              </ConsultationApplyButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ─── main component ─── */
export function LandingPageV2({ cms }: { cms?: LandingCmsContent }) {
  useReveal();
  const [pricingTier] = usePricingSchoolTier();

  const getCmsValue = (section: string, key: string, fallback: string) =>
    cms?.siteContent[section]?.[key] ?? fallback;
  const getCmsMultiline = (section: string, key: string, fallback: string) =>
    formatCmsMultiline(getCmsValue(section, key, fallback));

  /* ── CMS data (identical processing to LandingPageThemed) ── */
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

  const cmsResults = results.flatMap(([student, before, after], index) => {
    const n = index + 1;
    const vis = getCmsValue("results", `result${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) return [];
    return [
      {
        student: getCmsValue("results", `result${n}_student`, student),
        before: getCmsValue("results", `result${n}_before`, before),
        after: getCmsValue("results", `result${n}_after`, after),
        image: getCmsValue(
          "results",
          `result${n}_image`,
          DEFAULT_RESULT_IMAGES[index] ?? DEFAULT_RESULT_IMAGES[0],
        ),
      },
    ];
  });
  const doubledResults =
    cmsResults.length > 0 ? [...cmsResults, ...cmsResults] : [];

  const cmsTeachers = teachers.flatMap((t, index) => {
    const n = index + 1;
    const vis = getCmsValue("teachers", `teacher${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis)) return [];
    const careers = getCmsValue(
      "teachers",
      `teacher${n}_careers`,
      t.careers.join("\n"),
    )
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    return [
      {
        subject: getCmsValue("teachers", `teacher${n}_subject`, t.subject),
        name: getCmsValue("teachers", `teacher${n}_name`, t.name),
        image: getCmsValue("teachers", `teacher${n}_image`, t.image),
        highlight: getCmsValue(
          "teachers",
          `teacher${n}_highlight`,
          t.highlight,
        ),
        careers: careers.length > 0 ? careers : t.careers,
      },
    ];
  });

  const cmsSteps = steps.flatMap((step, index) => {
    const n = index + 1;
    const vis = getCmsValue("features", `step${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, n <= 5))
      return [];
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
      1: { label: "진도 관리", desc: "주간 진도와 목표 달성률을 매니저·가정과 공유합니다." },
      2: { label: "질문 관리", desc: "복습 질문에 대한 즉각 피드백으로 자기주도 학습을 돕습니다." },
      3: { label: "리포트", desc: "월간 학습 데이터와 취약 유형 분석을 리포트로 제공합니다." },
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

  const cmsTestimonials =
    cms && cms.testimonials.length > 0
      ? cms.testimonials.slice(0, 3)
      : [
          {
            quote:
              "공부하러 가서도 시간만 보내던 아이가 처음으로 공부 계획을 직접 잡고 실행했어요. 정말 아이에 맞는 선생님을 찾아주셔서 안심됐습니다.",
            info: "고2 수학 · 학부모",
            img: "",
          },
          {
            quote:
              "방황하는 아들의 방향을 잡아 줄 선생님이 필요했는데, 정확히 맞는 분을 찾아줬어요. 아이가 선생님처럼 되고 싶다며 열심히 합니다.",
            info: "고3 수학 · 학부모",
            img: "",
          },
          {
            quote:
              "숙제와 공부 계획을 등록하고 선생님이랑 같이 점검하니 자연스럽게 매일 공부하게 됐어요. 성적보다 습관이 먼저 바뀌었어요.",
            info: "중3 영어 · 학생",
            img: "",
          },
        ];

  const homePricingItems = useMemo(() => {
    const all = buildVisiblePricingPlanItems(cms?.siteContent, pricingTier);
    const picked = all.filter((_, i) => i === 0 || i === 2);
    return picked.length >= 2 ? picked : all.slice(0, 2);
  }, [cms?.siteContent, pricingTier]);

  const footerCopyright = getCmsValue(
    "footer",
    "copyright",
    "© {year} Concord Private Tutoring. All rights reserved.",
  ).replace("{year}", String(new Date().getFullYear()));

  return (
    <div className="lp2-root">
      <V2Header showFaqLink={true} />

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className="lp2-hero" style={{ background: "var(--bg)" }}>
        <div className="lp2-hero-bg" />
        <div className="lp2-wrap lp2-hero-inner">
          <span className="lp2-eyebrow">Concord Private Tutoring</span>
          <h1>
            학생마다 맞는 <em className="lp2-hl">선생님</em>이 다릅니다
          </h1>
          <p className="lp2-lede">
            {getCmsValue(
              "hero",
              "subtext",
              "전문 매니저가 직접 상담하고, 우리 아이에게 꼭 맞는 선생님을 찾아드립니다.",
            )}
          </p>
          <div className="lp2-cta-row">
            <ConsultationApplyButton className="lp2-btn lp2-btn-acc">
              무료 상담 신청
            </ConsultationApplyButton>
            <Link href="/tutors" className="lp2-btn lp2-btn-ghost">
              선생님 둘러보기 →
            </Link>
          </div>

          {/* Stats */}
          <div className="lp2-stats">
            {cmsStats.map((s) => {
              const hasPlus = s.value.includes("+");
              const hasPct = s.value.includes("%");
              const base = s.value.replace(/[+%]/, "");
              const suffix = hasPlus ? "+" : hasPct ? "%" : "";
              return (
                <div key={s.label} className="lp2-stat">
                  <div className="n">
                    {base}
                    {suffix && <em>{suffix}</em>}
                  </div>
                  <div className="l">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ RESULTS MARQUEE ═══════════════════════════════ */}
      <div className="lp2-marquee">
        <div className="lp2-marquee-track">
          {doubledResults.map((item, i) => (
            <span key={i} className="lp2-chip">
              <b>{item.student}</b>
              {item.before}
              <span className="arr">→</span>
              <span className="up">{item.after}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ TEACHERS ══════════════════════════════════════ */}
      <section
        id="teachers"
        className="lp2-sec"
        style={{ background: "var(--bg)", scrollMarginTop: "80px" }}
      >
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">Teachers</span>
            <h2>
              명문대 출신부터
              <br />
              경력 10년 이상 전문가까지
            </h2>
            <p>
              {getCmsValue(
                "teachers",
                "section_subtext",
                "확실한 서류 인증과 채용 절차로 엄선된, 인품과 실력 모두 확실한 선생님을 배정해드립니다.",
              )}
            </p>
          </div>

          <div className="lp2-grid-4">
            {cmsTeachers.map((t, i) => (
              <article key={`${t.name}-${i}`} className="lp2-t-card reveal">
                <div className="lp2-t-media">
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width:680px) 100vw, (max-width:960px) 50vw, 320px"
                  />
                  <span className="lp2-t-tag">{t.subject}</span>
                </div>
                <div className="lp2-t-body">
                  <div className="lp2-t-name">{t.name} 선생님</div>
                  <p className="lp2-t-line">{t.highlight}</p>
                  <div className="lp2-t-edu">경력</div>
                  <ul className="lp2-t-items">
                    {t.careers.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className="reveal" style={{ marginTop: "40px" }}>
            <Link href="/tutors" className="lp2-btn lp2-btn-ghost lp2-btn-sm">
              전체 선생님 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ LEARNING CARE ═════════════════════════════════ */}
      <section
        id="management"
        className="lp2-sec"
        style={{ background: "var(--panel)", scrollMarginTop: "80px" }}
      >
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">Learning Care</span>
            <h2>수업 밖에서도 이어지는 학습 관리</h2>
            <p>
              {getCmsValue(
                "management",
                "subtext",
                "진도, 숙제, 질문, 리포트를 한 화면에서 연결해 학생·선생님·매니저가 같은 목표를 봅니다.",
              )}
            </p>
          </div>

          <div className="lp2-grid-3">
            {managementItems.map((item) => (
              <div key={item.n} className="lp2-care-card reveal">
                <div className="num">0{item.n}</div>
                <h3>{item.label}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PROCESS ═══════════════════════════════════════ */}
      <section
        id="process"
        className="lp2-sec"
        style={{ background: "var(--bg)", scrollMarginTop: "80px" }}
      >
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">Process</span>
            <h2>이렇게 진행됩니다</h2>
            <p>상담부터 매칭, 수업까지 1:1로 학생의 성장에 집중해요.</p>
          </div>

          <div>
            {cmsSteps.map((step, i) => (
              <div key={step.number} className="lp2-proc-row reveal">
                <div
                  className="lp2-proc-n"
                  style={i === 0 ? { color: "var(--acc-text)" } : undefined}
                >
                  {step.number}
                </div>
                <div className="lp2-proc-c">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ═══════════════════════════════════════ */}
      <section
        id="pricing"
        className="lp2-sec"
        style={{ background: "var(--panel)", scrollMarginTop: "80px" }}
      >
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">Plans</span>
            <h2>
              1:1 맞춤 과외,{" "}
              <span className="lp2-hl">
                {getCmsValue("home_page", "pricing_title", "월 40만원부터")}
              </span>
            </h2>
            <p>
              {getCmsValue(
                "home_page",
                "pricing_subtext",
                "모든 플랜에 학습 관리와 강사 첨삭이 포함됩니다.",
              )}
            </p>
          </div>

          <div className="lp2-price-grid reveal">
            {homePricingItems.map((item, i) => {
              const isRec = i === 1;
              const priceText = item.price ?? item.plan.title;
              const featureList = item.features ?? item.plan.features;
              const numOnly = priceText.replace(/[^0-9,]/g, "");
              return (
                <div
                  key={item.plan.id}
                  className={`lp2-price-card${isRec ? " rec" : ""}`}
                >
                  {isRec && <span className="lp2-rec-badge">추천</span>}
                  <div className="ptag">{item.subtitle ?? item.plan.subtitle}</div>
                  <div className="pname">{item.title ?? item.plan.title}</div>
                  <div className="price">
                    {numOnly}
                    <small>원 / 월</small>
                  </div>
                  <ul className="lp2-pfeat">
                    {featureList.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <ConsultationApplyButton
                    className={`lp2-btn${isRec ? " lp2-btn-acc" : " lp2-btn-ghost"}`}
                  >
                    이 플랜으로 시작
                  </ConsultationApplyButton>
                </div>
              );
            })}
          </div>

          <div className="reveal" style={{ marginTop: "32px" }}>
            <Link href="/pricing" className="lp2-btn lp2-btn-ghost lp2-btn-sm">
              요금제 더보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ COMPARE ═══════════════════════════════════════ */}
      <section
        id="compare"
        className="lp2-sec"
        style={{ background: "var(--bg)", scrollMarginTop: "80px" }}
      >
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">Compare</span>
            <h2>개인 과외와 무엇이 다른가요</h2>
            <p>
              맞지 않는 선생님으로 1~2달을 낭비하지 않도록, 처음부터 핏을
              맞춥니다.
            </p>
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
                {compareRows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>
                      {row.general === "없음" ? (
                        <>
                          <span className="lp2-no">✗</span>
                          {row.general}
                        </>
                      ) : (
                        row.general
                      )}
                    </td>
                    <td className="lp2-col-c">
                      <span className="lp2-ok">✓</span>
                      {row.concord}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══ REVIEWS ═══════════════════════════════════════ */}
      <section
        id="reviews"
        className="lp2-sec"
        style={{ background: "var(--panel)", scrollMarginTop: "80px" }}
      >
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">Reviews</span>
            <h2>성적보다 습관이 먼저 바뀌었어요</h2>
          </div>

          <div className="lp2-rev-grid">
            {cmsTestimonials.map((t, i) => (
              <div key={i} className="lp2-rev-card reveal">
                <div className="quote">&ldquo;</div>
                <p className="qt">{t.quote}</p>
                <div className="by">{t.info}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BAND ══════════════════════════════════════ */}
      <section className="lp2-sec" style={{ background: "var(--bg)" }}>
        <div className="lp2-wrap">
          <div className="lp2-cta-band reveal">
            <div>
              <h2>
                {getCmsValue(
                  "cta",
                  "headline",
                  "우리 아이에게 맞는 선생님,\n지금 무료로 찾아보세요",
                )}
              </h2>
              <p>
                {getCmsValue(
                  "cta",
                  "subtext",
                  "무료 상담 1회 · 매니저 직접 배정 · 첫 달 학습 리포트 무료",
                )}
              </p>
            </div>
            <ConsultationApplyButton
              className="lp2-btn"
              style={
                { background: "var(--on-acc)", color: "var(--acc)" } as React.CSSProperties
              }
            >
              무료 상담 신청하기
            </ConsultationApplyButton>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════ */}
      <footer className="lp2-footer" style={{ background: "var(--bg)" }}>
        <div className="lp2-wrap">
          <div className="lp2-foot-top">
            <div>
              <Link href="/" className="lp2-logo">
                Concord<span>.</span>
              </Link>
              <p
                style={{
                  color: "var(--mut)",
                  fontSize: "14px",
                  marginTop: "10px",
                }}
              >
                {getCmsValue("footer", "hours_chat", "채팅문의 10:00~22:00")} ·{" "}
                {getCmsValue(
                  "footer",
                  "hours_call",
                  "전화문의 평일 10:00~19:00",
                )}
              </p>
            </div>

            <div className="lp2-foot-cols">
              <div className="lp2-foot-col">
                <h4>서비스</h4>
                <Link href="/tutors">강사진</Link>
                <Link href="/pricing">요금제</Link>
                <Link href="/faq">FAQ</Link>
                <ConsultationApplyButton>상담 신청</ConsultationApplyButton>
              </div>
              <div className="lp2-foot-col">
                <h4>SNS</h4>
                <a
                  href={getCmsValue(
                    "footer",
                    "sns_instagram",
                    "https://instagram.com",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
                <a
                  href={getCmsValue(
                    "footer",
                    "sns_youtube",
                    "https://youtube.com",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YouTube
                </a>
                <a
                  href={getCmsValue(
                    "footer",
                    "sns_blog",
                    "https://blog.naver.com",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Blog
                </a>
              </div>
            </div>
          </div>

          <div className="lp2-foot-meta">
            <p>
              상호{" "}
              {getCmsValue("footer", "company_name", "주식회사 컨코드에듀케이션")} ·
              대표 {getCmsValue("footer", "company_rep", "홍길동")} ·
              사업자등록번호{" "}
              {getCmsValue("footer", "company_reg", "123-45-67890")}
              <br />
              주소{" "}
              {getCmsValue(
                "footer",
                "company_address",
                "서울특별시 강남구 테헤란로 000, 00층",
              )}
            </p>
            <div className="legal">
              <span>이용약관</span>
              <span>개인정보처리방침</span>
              <span>환불정책</span>
            </div>
            <div
              style={{
                marginTop: "24px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <p>{footerCopyright}</p>
              <Link
                href="/teacher-portal"
                style={{ fontSize: "12px", color: "var(--mut-2)" }}
              >
                {getCmsValue("footer", "label_teacher", "선생님이신가요?")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
