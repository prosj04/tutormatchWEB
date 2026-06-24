"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
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

type TeacherPortalShellLegacyProps = {
  teacherName: string;
  role: PortalTeacherRole;
  children: React.ReactNode;
};

/** 기존 Tailwind 포털 셸 — NEXT_PUBLIC_PORTAL_DESIGN=legacy 시 사용 */
export function TeacherPortalShellLegacy({
  teacherName,
  role,
  children,
}: TeacherPortalShellLegacyProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("cms_edit") === "1";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navItems =
    role === "MANAGER" ? [...BASE_NAV, ...MANAGER_NAV] : [...BASE_NAV];

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

  const titleSuffix = role === "MANAGER" ? titleManagerSuffix : titleTeacherSuffix;
  const currentItem = navItems.find((item) => isActive(item.href, "exact" in item ? item.exact : false));
  const activeNavLabel = currentItem ? navLabelByKey[currentItem.cmsKey] : "메뉴";

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-surface shadow-sm">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-text-primary md:hidden"
            aria-label="포털 메뉴 열기"
          >
            <span className="space-y-1">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          </button>
          <div className="flex min-w-0 flex-1 items-center md:w-40 md:max-w-[10rem] md:flex-none">
            <Link
              href="/teacher-portal/dashboard"
              className="truncate font-sans text-base font-bold italic text-text-primary sm:text-lg"
            >
              <CmsEdit active={isEditMode} section="teacher_portal" cmsKey="brand" type="text">
                {brand}
              </CmsEdit>
            </Link>
          </div>
          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <p className="truncate text-sm font-semibold text-text-primary lg:text-base">
              {teacherName}님
              <CmsEdit
                active={isEditMode}
                section="teacher_portal"
                cmsKey={role === "MANAGER" ? "title_manager_suffix" : "title_teacher_suffix"}
                type="text"
              >
                {titleSuffix}
              </CmsEdit>
            </p>
          </div>
          <div className="flex min-w-0 flex-1 justify-center md:hidden">
            <div className="min-w-0 text-center">
              <p className="truncate text-sm font-semibold text-text-primary">
                {teacherName}님
              </p>
              <p className="truncate text-[11px] text-text-muted">{activeNavLabel}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-1 md:w-44">
            <NotificationBell />
            <button
              type="button"
              onClick={() => signOut({ redirectTo: "/" })}
              className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:bg-background hover:text-text-primary md:inline-flex"
            >
              <CmsEdit active={isEditMode} section="teacher_portal" cmsKey="logout" type="text">
                {logoutLabel}
              </CmsEdit>
            </button>
          </div>
        </div>
        <nav className="hidden gap-3 overflow-x-auto border-t border-gray-100 px-4 md:flex md:gap-6">
          {navItems.map((item) => {
            const exact = "exact" in item ? item.exact : false;
            const active = isActive(item.href, exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 border-b-2 py-3 text-sm font-medium transition ${
                  active
                    ? "border-primary text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <CmsEdit active={isEditMode} section="teacher_portal" cmsKey={item.cmsKey} type="text">
                  {navLabelByKey[item.cmsKey]}
                </CmsEdit>
              </Link>
            );
          })}
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition md:hidden ${
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden={!mobileNavOpen}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] flex-col bg-white transition-transform duration-300 md:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileNavOpen}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-5">
          <div className="min-w-0">
            <p className="truncate font-sans text-lg font-bold italic text-text-primary">
              <CmsEdit active={isEditMode} section="teacher_portal" cmsKey="brand" type="text">
                {brand}
              </CmsEdit>
            </p>
            <p className="mt-1 truncate text-xs text-text-secondary">
              {teacherName}님
              <CmsEdit
                active={isEditMode}
                section="teacher_portal"
                cmsKey={role === "MANAGER" ? "title_manager_suffix" : "title_teacher_suffix"}
                type="text"
              >
                {titleSuffix}
              </CmsEdit>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-full bg-background px-3 py-1 text-sm font-medium text-text-primary"
            aria-label="포털 메뉴 닫기"
          >
            닫기
          </button>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
          {navItems.map((item) => {
            const exact = "exact" in item ? item.exact : false;
            const active = isActive(item.href, exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "bg-background text-text-primary hover:bg-primary/5"
                }`}
              >
                <CmsEdit active={isEditMode} section="teacher_portal" cmsKey={item.cmsKey} type="text">
                  {navLabelByKey[item.cmsKey]}
                </CmsEdit>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 px-4 py-4">
          <button
            type="button"
            onClick={() => signOut({ redirectTo: "/" })}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-text-primary"
          >
            <CmsEdit active={isEditMode} section="teacher_portal" cmsKey="logout" type="text">
              {logoutLabel}
            </CmsEdit>
          </button>
        </div>
      </aside>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-[4.5rem] md:px-8 md:pt-[7.25rem]">{children}</main>
    </div>
  );
}
