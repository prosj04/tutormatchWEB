"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import { ConcordPortalThemeControls } from "@/components/concord/ConcordPortalThemeControls";

const NAV = [
  { href: "/admin", label: "대시보드", exact: true },
  { href: "/admin/funnel", label: "전환 퍼널" },
  { href: "/admin/students", label: "학생 관리" },
  { href: "/admin/teachers", label: "선생님 관리" },
  { href: "/admin/matches", label: "매칭 관리" },
  { href: "/admin/cms", label: "사이트 콘텐츠" },
  { href: "/admin/data", label: "전체 데이터" },
];

type AdminShellConcordProps = {
  email: string;
  children: React.ReactNode;
};

export function AdminShellConcord({ email, children }: AdminShellConcordProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activeLabel = useMemo(() => {
    const activeItem = NAV.find((item) =>
      item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
    return activeItem?.label ?? "관리자 패널";
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="portal-admin" data-portal-content>
      <aside className="portal-admin-aside">
        <div className="portal-admin-aside-head">
          <p>
            Concord<span style={{ color: "var(--acc-text)" }}>.</span>
          </p>
          <p>Admin</p>
        </div>
        <nav className="portal-admin-nav" aria-label="관리자 메뉴">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href, item.exact) ? "active" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="portal-admin-body">
        <header className="portal-admin-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className={`nav-hamburger portal-nav-hamburger${open ? " open" : ""}`}
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
            <div className="min-w-0">
              <h1>관리자 패널</h1>
              <p className="truncate text-xs text-text-muted md:hidden">{activeLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ConcordPortalThemeControls />
            <span className="hidden max-w-[200px] truncate text-sm text-text-secondary sm:block">{email}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => signOut({ redirectTo: "/login" })}>
              로그아웃
            </button>
          </div>
        </header>

        <button
          type="button"
          className={`mobile-backdrop portal-mobile-only${open ? " open" : ""}`}
          aria-label="메뉴 닫기"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
        />

        <div
          className={`mobile-drawer portal-mobile-only portal-mobile-drawer portal-admin-mobile-drawer${open ? " open" : ""}`}
          aria-hidden={!open}
          role="dialog"
          aria-modal={open}
          aria-label="관리자 메뉴"
        >
          <div className="mobile-drawer-inner">
            <p className="mobile-user">{email}</p>
            <nav className="mobile-nav" aria-label="관리자 메뉴">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href, item.exact) ? "active" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mobile-drawer-foot">
              <div className="mobile-theme">
                <span className="mobile-theme-label">테마</span>
                <ConcordPortalThemeControls />
              </div>
              <div className="mobile-actions">
                <button
                  type="button"
                  className="btn btn-block"
                  style={{ background: "var(--fg)", color: "var(--bg)" }}
                  onClick={() => {
                    setOpen(false);
                    void signOut({ redirectTo: "/login" });
                  }}
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="portal-admin-content">{children}</main>
      </div>
    </div>
  );
}
