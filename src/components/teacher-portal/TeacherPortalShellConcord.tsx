"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConcordPortalThemeControls } from "@/components/concord/ConcordPortalThemeControls";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";
import type { PortalTeacherRole } from "@/lib/portal-roles";

const BASE_NAV = [
  { href: "/teacher-portal/dashboard", cmsKey: "nav_dashboard", exact: true as const },
  { href: "/teacher-portal/dashboard/profile", cmsKey: "nav_profile" },
  { href: "/teacher-portal/dashboard/students", cmsKey: "nav_students" },
] as const;

const MANAGER_NAV = [
  { href: "/teacher-portal/dashboard/matching", cmsKey: "nav_matching" },
  { href: "/teacher-portal/dashboard/consultations", cmsKey: "nav_consultations" },
  { href: "/teacher-portal/dashboard/monitoring", cmsKey: "nav_monitoring" },
] as const;

const TP_NAV_DEFAULTS: Record<(typeof BASE_NAV)[number]["cmsKey"] | (typeof MANAGER_NAV)[number]["cmsKey"], string> = {
  nav_dashboard: "대시보드",
  nav_profile: "프로필 관리",
  nav_students: "학생 관리",
  nav_matching: "매칭 관리",
  nav_consultations: "상담 관리",
  nav_monitoring: "모니터링",
};

type TeacherPortalShellConcordProps = {
  teacherName: string;
  role: PortalTeacherRole;
  children: React.ReactNode;
};

export function TeacherPortalShellConcord({
  teacherName,
  role,
  children,
}: TeacherPortalShellConcordProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("cms_edit") === "1";
  const [open, setOpen] = useState(false);
  const navItems = role !== "TEACHER" ? [...BASE_NAV, ...MANAGER_NAV] : [...BASE_NAV];

  const brand = usePortalCopy("teacher_portal", "brand", "Concord.");
  const titleTeacherSuffix = usePortalCopy("teacher_portal", "title_teacher_suffix", " · 선생님 포털");
  const titleManagerSuffix = usePortalCopy("teacher_portal", "title_manager_suffix", " · 매니저 포털");
  const logoutLabel = usePortalCopy("teacher_portal", "logout", "로그아웃");

  const navDashboard = usePortalCopy("teacher_portal", "nav_dashboard", TP_NAV_DEFAULTS.nav_dashboard);
  const navProfile = usePortalCopy("teacher_portal", "nav_profile", TP_NAV_DEFAULTS.nav_profile);
  const navStudents = usePortalCopy("teacher_portal", "nav_students", TP_NAV_DEFAULTS.nav_students);
  const navMatching = usePortalCopy("teacher_portal", "nav_matching", TP_NAV_DEFAULTS.nav_matching);
  const navConsultations = usePortalCopy(
    "teacher_portal",
    "nav_consultations",
    TP_NAV_DEFAULTS.nav_consultations,
  );
  const navMonitoring = usePortalCopy("teacher_portal", "nav_monitoring", TP_NAV_DEFAULTS.nav_monitoring);

  const navLabelByKey: Record<string, string> = {
    nav_dashboard: navDashboard,
    nav_profile: navProfile,
    nav_students: navStudents,
    nav_matching: navMatching,
    nav_consultations: navConsultations,
    nav_monitoring: navMonitoring,
  };

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const titleSuffix = role !== "TEACHER" ? titleManagerSuffix : titleTeacherSuffix;
  const currentItem = navItems.find((item) => isActive(item.href, "exact" in item ? item.exact : false));
  const activeNavLabel = currentItem ? navLabelByKey[currentItem.cmsKey] : "메뉴";

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

  return (
    <div className="portal-shell" data-portal-content>
      <header className={`portal-topbar${open ? " menu-open" : ""}`}>
        <div className="portal-topbar-inner">
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
          <Link href="/teacher-portal/dashboard" className="portal-topbar-brand" onClick={() => setOpen(false)}>
            <CmsEdit active={isEditMode} section="teacher_portal" cmsKey="brand" type="text">
              {brand.endsWith(".") ? brand.slice(0, -1) : brand}
              <span>.</span>
            </CmsEdit>
          </Link>
          <p className="portal-topbar-title hidden md:block">
            {teacherName}님
            <CmsEdit
              active={isEditMode}
              section="teacher_portal"
              cmsKey={role !== "TEACHER" ? "title_manager_suffix" : "title_teacher_suffix"}
              type="text"
            >
              {titleSuffix}
            </CmsEdit>
          </p>
          <p className="portal-topbar-title md:hidden">
            {teacherName}님 · {activeNavLabel}
          </p>
          <div className="portal-topbar-actions">
            <ConcordPortalThemeControls />
            <NotificationBell />
            <button type="button" className="btn btn-ghost btn-sm hidden md:inline-flex" onClick={() => signOut({ redirectTo: "/" })}>
              <CmsEdit active={isEditMode} section="teacher_portal" cmsKey="logout" type="text">
                {logoutLabel}
              </CmsEdit>
            </button>
          </div>
        </div>
      </header>

      <nav className="portal-subnav" aria-label="포털 메뉴">
        <div className="portal-subnav-inner">
          {navItems.map((item) => {
            const exact = "exact" in item ? item.exact : false;
            const active = isActive(item.href, exact);
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : undefined}>
                <CmsEdit active={isEditMode} section="teacher_portal" cmsKey={item.cmsKey} type="text">
                  {navLabelByKey[item.cmsKey]}
                </CmsEdit>
              </Link>
            );
          })}
        </div>
      </nav>

      <button
        type="button"
        className={`mobile-backdrop portal-mobile-only${open ? " open" : ""}`}
        aria-label="메뉴 닫기"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />

      <div
        className={`mobile-drawer portal-mobile-only portal-mobile-drawer${open ? " open" : ""}`}
        aria-hidden={!open}
        role="dialog"
        aria-modal={open}
        aria-label="포털 메뉴"
      >
        <div className="mobile-drawer-inner">
          <nav className="mobile-nav" aria-label="포털 메뉴">
            {navItems.map((item) => {
              const exact = "exact" in item ? item.exact : false;
              const active = isActive(item.href, exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "active" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <CmsEdit active={isEditMode} section="teacher_portal" cmsKey={item.cmsKey} type="text">
                    {navLabelByKey[item.cmsKey]}
                  </CmsEdit>
                </Link>
              );
            })}
          </nav>
          <div className="mobile-drawer-foot">
            <div className="mobile-theme">
              <span className="mobile-theme-label">테마</span>
              <ConcordPortalThemeControls showLabel={false} />
            </div>
            <div className="mobile-actions">
              <button type="button" className="btn btn-block" style={{ background: "var(--fg)", color: "var(--bg)" }} onClick={() => { setOpen(false); void signOut({ redirectTo: "/" }); }}>
                <CmsEdit active={isEditMode} section="teacher_portal" cmsKey="logout" type="text">
                  {logoutLabel}
                </CmsEdit>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="portal-main portal-main--with-subnav max-w-6xl">{children}</main>
    </div>
  );
}
