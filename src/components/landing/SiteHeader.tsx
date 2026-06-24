"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { useConsultationCta } from "@/hooks/useConsultationCta";
import { portalHomeHref } from "@/lib/portal-roles";
import { useDesignTheme } from "@/hooks/useDesignTheme";

function displayName(session: { user?: { name?: string | null; email?: string | null } }) {
  const n = session.user?.name?.trim();
  if (n) return n;
  const email = session.user?.email;
  if (email) return email.split("@")[0] ?? email;
  return "회원";
}

const baseNavLinks = [
  { href: "/tutors", label: "강사진", id: "tutors" as const },
  { href: "/pricing", label: "요금제", id: "pricing" as const },
  { href: "/reviews", label: "학습후기", id: "reviews" as const },
  { href: "/#compare", label: "비교하기", id: "compare" as const },
  { href: "/faq", label: "FAQ", id: "faq" as const },
];

/* ─── V2 theme controls (color picker + mode toggle) ─── */
function V2ThemeControls({
  color,
  mode,
  setColor,
  toggleMode,
}: {
  color: "green" | "blue";
  mode: "light" | "dark";
  setColor: (c: "green" | "blue") => void;
  toggleMode: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Color picker */}
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
        aria-label={mode === "dark" ? "라이트 모드" : "다크 모드"}
      >
        {mode === "dark" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 19, height: 19 }}>
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 19, height: 19 }}>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </div>
  );
}

function SessionActions({
  mobile = false,
  onNavigate,
  scrolled = true,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
  scrolled?: boolean;
}) {
  const { data: session, status } = useSession();
  const goConsultation = useConsultationCta();
  const role = session?.user?.role;
  const name = session ? displayName(session) : "";
  const buttonBase = mobile
    ? "flex min-h-[44px] w-full items-center justify-center rounded-full px-5 py-3 text-base font-bold transition"
    : "inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2 text-sm font-bold transition";

  if (status === "loading") {
    return (
      <div className={mobile ? "space-y-3" : "flex items-center gap-2"}>
        <span className="inline-block h-9 w-24 animate-pulse rounded-full bg-neutral-20" />
        <span className="inline-block h-9 w-28 animate-pulse rounded-full bg-neutral-20" />
      </div>
    );
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <div className={mobile ? "space-y-3" : "flex items-center gap-2"}>
        <Link
          href="/login"
          onClick={onNavigate}
          className={`${buttonBase} ${
            mobile
              ? "text-neutral-100 hover:bg-neutral-10"
              : scrolled
                ? "text-neutral-100 hover:text-primary"
                : "text-white hover:bg-white/10"
          }`}
        >
          로그인
        </Link>
        <button
          type="button"
            onClick={() => {
              onNavigate?.();
              void goConsultation();
            }}
          className={`${buttonBase} shadow-sm ${
            mobile || scrolled
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-white text-neutral-100 hover:bg-white/90"
          }`}
        >
          상담 신청
        </button>
      </div>
    );
  }

  const portalHref =
    role === "ADMIN"
      ? "/admin"
      : role === "TEACHER" || role === "MANAGER"
        ? "/teacher-portal/dashboard"
        : "/dashboard";
  const portalLabel =
    role === "ADMIN" ? "관리자" : role === "TEACHER" || role === "MANAGER" ? "선생님 포털" : "내 학습";
  const nameLabel = role === "ADMIN" ? `${name}님 (관리자)` : `${name}님`;

  return (
    <div className={mobile ? "space-y-3" : "flex items-center gap-3"}>
      <span className={mobile ? "block text-center text-base font-bold text-neutral-100" : "hidden text-sm font-bold text-neutral-100 lg:inline"}>
        {nameLabel}
      </span>
      <Link
        href={portalHref}
        onClick={onNavigate}
        className={`${buttonBase} border border-neutral-20 bg-white text-neutral-100 hover:border-primary hover:text-primary`}
      >
        {portalLabel}
      </Link>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          void signOut({ redirectTo: "/" });
        }}
        className={`${buttonBase} bg-neutral-100 text-white hover:bg-neutral-90`}
      >
        로그아웃
      </button>
    </div>
  );
}

export function SiteHeader({
  variant = "auto",
  showFaqLink = true,
  showReviewsLink = true,
}: {
  variant?: "auto" | "light";
  showFaqLink?: boolean;
  showReviewsLink?: boolean;
}) {
  const navLinks = baseNavLinks.filter((link) => {
    if (link.id === "faq") return showFaqLink;
    if (link.id === "reviews") return showReviewsLink;
    return true;
  });
  const { data: session } = useSession();
  const { color, mode, setColor, toggleMode } = useDesignTheme();
  const logoHref = portalHomeHref(session?.user?.role);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(variant === "light");

  useEffect(() => {
    if (variant === "light") {
      setScrolled(true);
      return;
    }

    let frameId = 0;
    const updateTone = () => {
      frameId = 0;
      const hero = document.getElementById("hero");
      const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : window.innerHeight;
      setScrolled(window.scrollY >= heroBottom);
    };

    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateTone);
    };

    updateTone();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [variant]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const solidHeader = scrolled || open;
  const headerTone = solidHeader
    ? "border-neutral-20 bg-white text-neutral-100 shadow-sm"
    : "border-white/10 bg-neutral-100 text-neutral-100 sm:bg-neutral-100/80 sm:text-white sm:backdrop-blur";
  const topBarTone = solidHeader
    ? "bg-neutral-10 text-neutral-80"
    : "bg-black/20 text-white/70";
  const hoverTone = solidHeader ? "hover:text-neutral-100" : "hover:text-white";

  return (
    <header
      className={`fixed left-0 top-0 z-50 flex w-full flex-col border-b transition-all duration-300 ease-in-out ${headerTone}`}
    >
      <div className={`hidden h-9 w-full transition-all duration-300 ease-in-out md:block ${topBarTone}`}>
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-end px-5 text-xs font-medium">
          {showFaqLink ? (
            <Link href="/faq" className={`px-3 transition ${hoverTone}`}>
              자주 묻는 질문
            </Link>
          ) : null}
          <Link href="/register/teacher" className={`px-3 transition ${hoverTone}`}>
            선생님 지원
          </Link>
        </div>
      </div>

      <div className="relative z-[70] mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-3 px-4 md:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-8">
          <Link href={logoHref} className="shrink-0 text-lg font-black tracking-tight transition-colors sm:text-xl">
            Concord.
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                  scrolled ? "hover:bg-neutral-10" : "hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <V2ThemeControls color={color} mode={mode} setColor={setColor} toggleMode={toggleMode} />
          <SessionActions scrolled={scrolled} />
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition md:hidden ${
            solidHeader
              ? "border-neutral-20 text-neutral-100"
              : "border-neutral-20 text-neutral-100 sm:border-white/30 sm:text-white"
          }`}
          aria-expanded={open}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        >
          {open ? (
            <span className="text-2xl leading-none" aria-hidden>
              ×
            </span>
          ) : (
            <span className="space-y-1.5" aria-hidden>
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          )}
        </button>
      </div>

      <div
        role="presentation"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 top-16 z-[55] bg-neutral-100/40 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        id="site-header-mobile-menu"
        className={`fixed inset-x-0 bottom-0 top-16 z-[60] overflow-y-auto bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex min-h-full flex-col justify-between gap-8 px-4 py-6 md:px-6">
          <div>
            <div className="flex flex-wrap justify-end gap-2 text-sm font-semibold text-neutral-80">
              {showFaqLink ? (
                <Link
                  href="/faq"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-[44px] items-center rounded-2xl px-3 transition hover:bg-neutral-10 hover:text-neutral-100"
                >
                  자주 묻는 질문
                </Link>
              ) : null}
              <Link
                href="/register/teacher"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-[44px] items-center rounded-2xl px-3 transition hover:bg-neutral-10 hover:text-neutral-100"
              >
                선생님 지원
              </Link>
            </div>
            <nav className="mt-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] items-center rounded-3xl px-4 text-2xl font-black text-neutral-100 transition hover:bg-neutral-10 sm:text-3xl"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="space-y-4">
            <div className="flex justify-center">
              <V2ThemeControls color={color} mode={mode} setColor={setColor} toggleMode={toggleMode} />
            </div>
            <SessionActions mobile onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </header>
  );
}
