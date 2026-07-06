"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { useConsultationCta } from "@/hooks/useConsultationCta";
import { useDesignTheme } from "@/hooks/useDesignTheme";
import { portalHomeHref } from "@/lib/portal-roles";

import { ConcordMoonIcon, ConcordSunIcon } from "./ConcordMoonIcon";

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
  if (href.startsWith("/#")) return pathname === "/";
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
}: {
  showFaqLink?: boolean;
  showReviewsLink?: boolean;
  showCompareLink?: boolean;
}) {
  const pathname = usePathname();
  const goConsultation = useConsultationCta();
  const { data: session, status } = useSession();
  const { color, toggleMode, setColor } = useDesignTheme();
  const [open, setOpen] = useState(false);

  const logoHref = portalHomeHref(session?.user?.role);
  const role = session?.user?.role;
  const name = session ? displayName(session) : "";
  const portalHref =
    role === "ADMIN"
      ? "/admin"
      : role === "TEACHER" || role === "MANAGER" || role === "CHIEF_MANAGER"
        ? "/teacher-portal/dashboard"
        : "/dashboard";
  const portalLabel =
    role === "ADMIN" ? "관리자" : role === "TEACHER" || role === "MANAGER" || role === "CHIEF_MANAGER" ? "선생님 포털" : "내 학습";

  const links = [
    ...BASE_NAV.filter((l) => {
      if (l.id === "faq") return showFaqLink;
      if (l.id === "reviews") return showReviewsLink;
      return true;
    }),
    ...(showCompareLink ? [{ href: "/#compare", label: "비교하기", id: "compare" }] : []),
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
                <span style={{ width: 72, height: 36, borderRadius: 999, background: "var(--panel-2)", display: "inline-block" }} />
              ) : status === "authenticated" && session?.user ? (
                <>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--mut)" }}>{name}님</span>
                  <Link href={portalHref} className="btn btn-ghost btn-sm">
                    {portalLabel}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: "var(--fg)", color: "var(--bg)" }}
                    onClick={() => void signOut({ redirectTo: "/" })}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-ghost btn-sm">
                    로그인
                  </Link>
                  <button type="button" className="btn btn-acc btn-sm" onClick={() => void goConsultation("header")}>
                    무료 상담
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
                <span style={{ fontSize: 22, lineHeight: 1 }}>×</span>
              ) : (
                <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor" aria-hidden>
                  <rect x="0" y="0" width="20" height="2" rx="1" />
                  <rect x="0" y="7" width="20" height="2" rx="1" />
                  <rect x="0" y="14" width="20" height="2" rx="1" />
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
              <p className="mobile-user">{name}님</p>
            ) : null}

            <div className="mobile-actions">
              {status === "authenticated" && session?.user ? (
                <>
                  <Link href={portalHref} className="btn btn-ghost btn-block" onClick={() => setOpen(false)}>
                    {portalLabel}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-block"
                    style={{ background: "var(--fg)", color: "var(--bg)" }}
                    onClick={() => {
                      setOpen(false);
                      void signOut({ redirectTo: "/" });
                    }}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-ghost btn-block" onClick={() => setOpen(false)}>
                    로그인
                  </Link>
                  <button
                    type="button"
                    className="btn btn-acc btn-block"
                    onClick={() => {
                      setOpen(false);
                      void goConsultation("header_mobile");
                    }}
                  >
                    무료 상담
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
