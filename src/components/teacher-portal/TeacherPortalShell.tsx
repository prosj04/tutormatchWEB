"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { PortalTeacherRole } from "@/lib/portal-roles";

const BASE_NAV = [
  { href: "/teacher-portal/dashboard", label: "대시보드", exact: true as const },
  { href: "/teacher-portal/dashboard/profile", label: "프로필 관리" },
  { href: "/teacher-portal/dashboard/students", label: "학생 관리" },
] as const;

const MANAGER_NAV = [
  { href: "/teacher-portal/dashboard/matching", label: "매칭 관리" },
  { href: "/teacher-portal/dashboard/consultations", label: "상담 관리" },
  { href: "/teacher-portal/dashboard/monitoring", label: "모니터링" },
] as const;

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

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const portalLabel = role === "MANAGER" ? "매니저 포털" : "선생님 포털";

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-card shadow-sm">
        <div className="flex h-14 items-center px-4">
          <div className="flex w-40 shrink-0 items-center">
            <Link href="/" className="font-display text-lg font-bold italic text-navy">
              Concord.
            </Link>
          </div>
          <div className="flex flex-1 justify-center">
            <p className="truncate text-sm font-semibold text-text-dark sm:text-base">
              {teacherName}님 · {portalLabel}
            </p>
          </div>
          <div className="flex w-44 shrink-0 items-center justify-end gap-1">
            <NotificationBell />
            <button
              type="button"
              onClick={() => signOut({ redirectTo: "/" })}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-mid transition hover:bg-background hover:text-text-dark"
            >
              로그아웃
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
                    ? "border-gold text-text-dark"
                    : "border-transparent text-text-mid hover:text-text-dark"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-[7.25rem] md:px-8">{children}</main>
    </div>
  );
}
