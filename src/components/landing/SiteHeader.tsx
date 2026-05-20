"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { useConsultationCta } from "@/hooks/useConsultationCta";

function displayName(session: { user?: { name?: string | null; email?: string | null } }) {
  const n = session.user?.name?.trim();
  if (n) return n;
  const email = session.user?.email;
  if (email) return email.split("@")[0] ?? email;
  return "회원";
}

const navLinks = [
  { href: "/tutors", label: "강사진" },
  { href: "/pricing", label: "요금제" },
  { href: "/reviews", label: "학습후기" },
  { href: "/faq", label: "FAQ" },
];

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
    ? "flex w-full items-center justify-center rounded-full px-5 py-3 text-base font-bold transition"
    : "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold transition";

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

export function SiteHeader({ variant = "auto" }: { variant?: "auto" | "light" }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(variant === "light");

  useEffect(() => {
    if (variant === "light") {
      setScrolled(true);
      return;
    }

    function handleScroll() {
      const hero = document.getElementById("hero");
      const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : window.innerHeight;
      setScrolled(window.scrollY >= heroBottom);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [variant]);

  const headerTone = scrolled
    ? "border-neutral-20 bg-white text-neutral-100 shadow-sm"
    : "border-white/10 bg-neutral-100/80 text-white backdrop-blur";
  const topBarTone = scrolled
    ? "bg-neutral-10 text-neutral-50"
    : "bg-black/20 text-white/70";
  const hoverTone = scrolled ? "hover:text-neutral-100" : "hover:text-white";

  return (
    <header
      className={`fixed left-0 top-0 z-50 flex w-full flex-col border-b transition-all duration-300 ease-in-out ${headerTone}`}
    >
      <div className={`hidden h-9 w-full transition-all duration-300 ease-in-out md:block ${topBarTone}`}>
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-end px-5 text-xs font-medium">
          <Link href="/faq" className={`px-3 transition ${hoverTone}`}>
            자주 묻는 질문
          </Link>
          <Link href="/register/teacher" className={`px-3 transition ${hoverTone}`}>
            선생님 지원
          </Link>
        </div>
      </div>

      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="shrink-0 text-xl font-black tracking-tight transition-colors">
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

        <div className="hidden md:block">
          <SessionActions scrolled={scrolled} />
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition md:hidden ${
            scrolled ? "border-neutral-20 text-neutral-100" : "border-white/30 text-white"
          }`}
          aria-label="메뉴 열기"
        >
          <span className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>
      </div>

      <div
        className={`fixed inset-0 z-[60] bg-white transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-neutral-20 px-5">
          <Link href="/" onClick={() => setOpen(false)} className="text-xl font-black text-neutral-100">
            Concord.
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-10 text-2xl leading-none text-neutral-100"
            aria-label="메뉴 닫기"
          >
            ×
          </button>
        </div>
        <div className="flex min-h-[calc(100dvh-4rem)] flex-col justify-between px-6 py-8">
          <div>
            <div className="flex justify-end gap-4 text-sm font-semibold text-neutral-50">
              <Link href="/faq" onClick={() => setOpen(false)}>
                자주 묻는 질문
              </Link>
              <Link href="/register/teacher" onClick={() => setOpen(false)}>
                선생님 지원
              </Link>
            </div>
            <nav className="mt-10 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-3xl px-4 py-4 text-3xl font-black text-neutral-100 transition hover:bg-neutral-10"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <SessionActions mobile onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </header>
  );
}
