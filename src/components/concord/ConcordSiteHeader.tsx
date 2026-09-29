"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { useConsultationCta } from "@/hooks/useConsultationCta";
import { useDesignTheme } from "@/hooks/useDesignTheme";
import { parseCmsVisibility } from "@/lib/cms-page-defaults";
import { portalHomeHref } from "@/lib/portal-roles";

import { ConcordLogoutIcon, ConcordMoonIcon, ConcordSunIcon } from "./ConcordMoonIcon";

type NavItem = { href: string; label: string; id: string };

const BASE_NAV: NavItem[] = [
  { href: "/pricing", label: "요금제", id: "pricing" },
  { href: "/tutors", label: "선생님", id: "tutors" },
  { href: "/reviews", label: "수강후기", id: "reviews" },
  { href: "/faq", label: "FAQ", id: "faq" },
  { href: "/docs", label: "자료실", id: "docs" },
];

function isActive(pathname: string, href: string) {
  if (href === "/tutors") return pathname === "/tutors" || pathname.startsWith("/tutors/");
  // 홈 안 앵커(비교하기 등)는 현재 위치 표시 대상이 아니다 — 홈에서 항상 활성으로 보이는 오표시 방지
  if (href.startsWith("/#")) return false;
  return pathname === href;
}

function displayName(session: { user?: { name?: string | null; email?: string | null } }) {
  const n = session.user?.name?.trim();
  if (n) return n;
  const email = session.user?.email;
  if (email) return email.split("@")[0] ?? email;
  return "회원";
}

export function ConcordSiteHeader({
  showFaqLink = true,
  showReviewsLink = true,
  showCompareLink = false,
  navCopy = {},
}: {
  showFaqLink?: boolean;
  showReviewsLink?: boolean;
  showCompareLink?: boolean;
  /** site_header CMS 문구 (없으면 기본값) */
  navCopy?: Record<string, string>;
}) {
  const c = (key: string, fallback: string) => navCopy[key] ?? fallback;
  const pathname = usePathname();
  const goConsultation = useConsultationCta();
  const { data: session, status } = useSession();
  const { color, toggleMode, setColor } = useDesignTheme();
  const [open, setOpen] = useState(false);
  const showThemePicker = parseCmsVisibility(navCopy["show_theme_picker"], false);

  const logoHref = portalHomeHref(session?.user?.role);
  const role = session?.user?.role;
  const name = session ? displayName(session) : "";
  const portalHref =
    role === "ADMIN"
      ? "/admin"
      : role === "TEACHER" || role === "MANAGER" || role === "CHIEF_MANAGER"
        ? "/teacher-portal/dashboard"
        : role === "PARENT"
          ? "/parent"
          : "/dashboard";
  const isStaff = role === "TEACHER" || role === "MANAGER" || role === "CHIEF_MANAGER";
  const portalLabel =
    role === "ADMIN"
      ? "관리자"
      : isStaff
        ? "선생님 포털"
        : role === "PARENT"
          ? "학부모 페이지"
          : "내 학습";
  const roleLabel =
    role === "ADMIN"
      ? "관리자"
      : isStaff
        ? "선생님"
        : role === "PARENT"
          ? "학부모"
          : "학생";
  // v3: 로그인 후 포털 이동은 보조 버튼 하나로 통일 — 헤더의 액센트 면은 비로그인 상담 CTA 한 곳만
  const portalBtnClass = "btn btn-ghost btn-sm";
  const avatarInitial = name ? Array.from(name)[0] ?? "회" : "회";

  const links = [
    ...BASE_NAV.filter((l) => {
      if (l.id === "faq") return showFaqLink;
      if (l.id === "reviews") return showReviewsLink;
      return true;
    }).map((l) => ({ ...l, label: c(`nav_${l.id}`, l.label) })),
    ...(showCompareLink ? [{ href: "/#compare", label: c("nav_compare", "비교하기"), id: "compare" }] : []),
  ];

  useEffect(() => {
    const header = document.querySelector("header.site");
    if (!header) return;
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className={`site${open ? " menu-open" : ""}`}>
        <div className="wrap nav">
          <Link className="logo" href={logoHref} onClick={() => setOpen(false)}>
            Concord<span>.</span>
          </Link>
          <nav className="nav-links">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={isActive(pathname, link.href) ? "active" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="nav-right">
            {showThemePicker ? (
              <div className="seg" role="group" aria-label="색 테마 선택">
                <button
                  type="button"
                  className="g"
                  aria-label="그린 테마"
                  aria-pressed={color === "green"}
                  onClick={() => setColor("green")}
                >
                  <span className="dot" />
                </button>
                <button
                  type="button"
                  className="b"
                  aria-label="블루 테마"
                  aria-pressed={color === "blue"}
                  onClick={() => setColor("blue")}
                >
                  <span className="dot" />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              className="theme-toggle"
              aria-label="다크 모드 전환"
              title="다크/라이트 전환"
              onClick={toggleMode}
            >
              <ConcordMoonIcon />
              <ConcordSunIcon />
            </button>

            <div className="nav-session-desktop">
              {status === "loading" ? (
                <span className="skel" style={{ width: 88, height: 34, borderRadius: 999, display: "inline-block" }} />
              ) : status === "authenticated" && session?.user ? (
                <>
                  <span className="sess">
                    <span className="av">{avatarInitial}</span>
                    <span>
                      <b>{name}</b> <span>{roleLabel}</span>
                    </span>
                  </span>
                  <Link href={portalHref} className={portalBtnClass}>
                    {portalLabel}
                  </Link>
                  <button
                    type="button"
                    className="lo-btn"
                    aria-label={c("btn_logout", "로그아웃")}
                    title={c("btn_logout", "로그아웃")}
                    onClick={() => void signOut({ redirectTo: "/" })}
                  >
                    <ConcordLogoutIcon />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-text btn-sm">
                    {c("btn_login", "로그인")}
                  </Link>
                  <button type="button" className="btn btn-acc btn-sm" onClick={() => void goConsultation("header")}>
                    {c("btn_consult", "무료 상담")}
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              className="nav-hamburger"
              aria-expanded={open}
              aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden><path d="M1 1l12 12M13 1L1 13" /></svg>
              ) : (
                <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                  <path d="M0 1h18M0 9h18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <button
        type="button"
        className={`mobile-backdrop${open ? " open" : ""}`}
        aria-label="메뉴 닫기"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />

      <div
        className={`mobile-drawer${open ? " open" : ""}`}
        aria-hidden={!open}
        role="dialog"
        aria-modal={open}
        aria-label="사이트 메뉴"
      >
        <div className="mobile-drawer-inner">
          <nav className="mobile-nav" aria-label="주요 메뉴">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={isActive(pathname, link.href) ? "active" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-drawer-foot">
            <div className="mobile-theme">
              <span className="mobile-theme-label">테마</span>
              <div className="mobile-theme-controls">
                {showThemePicker ? (
                  <div className="seg" role="group" aria-label="색 테마 선택">
                    <button
                      type="button"
                      className="g"
                      aria-label="그린 테마"
                      aria-pressed={color === "green"}
                      onClick={() => setColor("green")}
                    >
                      <span className="dot" />
                    </button>
                    <button
                      type="button"
                      className="b"
                      aria-label="블루 테마"
                      aria-pressed={color === "blue"}
                      onClick={() => setColor("blue")}
                    >
                      <span className="dot" />
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="theme-toggle"
                  onClick={toggleMode}
                  aria-label="다크 모드 전환"
                >
                  <ConcordMoonIcon />
                  <ConcordSunIcon />
                </button>
              </div>
            </div>

            {status === "authenticated" && session?.user ? (
              <span className="sess mobile-user">
                <span className="av">{avatarInitial}</span>
                <span>
                  <b>{name}</b> <span>{roleLabel}</span>
                </span>
              </span>
            ) : null}

            <div className="mobile-actions">
              {status === "authenticated" && session?.user ? (
                <>
                  <Link href={portalHref} className={`${portalBtnClass.replace("btn-sm", "btn-block")}`} onClick={() => setOpen(false)}>
                    {portalLabel}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    onClick={() => {
                      setOpen(false);
                      void signOut({ redirectTo: "/" });
                    }}
                  >
                    <ConcordLogoutIcon />
                    {c("btn_logout", "로그아웃")}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-ghost btn-block" onClick={() => setOpen(false)}>
                    {c("btn_login", "로그인")}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-acc btn-block"
                    onClick={() => {
                      setOpen(false);
                      void goConsultation("header_mobile");
                    }}
                  >
                    {c("btn_consult", "무료 상담")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
