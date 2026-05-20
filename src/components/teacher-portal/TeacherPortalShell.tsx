"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

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

type TeacherPortalShellProps = {
  teacherName: string;
  role: PortalTeacherRole;
  children: React.ReactNode;
};

export function TeacherPortalShell({
  teacherName,
  role,
  children,
}: TeacherPortalShellProps) {
  const pathname = usePathname();
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

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-surface shadow-sm">
        <div className="flex h-14 items-center px-4">
          <div className="flex w-40 shrink-0 items-center">
            <Link href="/" className="font-sans text-lg font-bold italic text-text-primary">
              {brand}
            </Link>
          </div>
          <div className="flex flex-1 justify-center">
            <p className="truncate text-sm font-semibold text-text-primary sm:text-base">
              {teacherName}님{titleSuffix}
            </p>
          </div>
          <div className="flex w-44 shrink-0 items-center justify-end gap-1">
            <NotificationBell />
            <button
              type="button"
              onClick={() => signOut({ redirectTo: "/" })}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:bg-background hover:text-text-primary"
            >
              {logoutLabel}
            </button>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto border-t border-gray-100 px-4 md:gap-6">
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
                {navLabelByKey[item.cmsKey]}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-[7.25rem] md:px-8">{children}</main>
    </div>
  );
}
