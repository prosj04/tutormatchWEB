"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/teacher-portal/dashboard", label: "대시보드", exact: true as const },
  { href: "/teacher-portal/dashboard/profile", label: "프로필 관리" },
  { href: "/teacher-portal/dashboard/students", label: "학생 관리" },
];

type TeacherPortalShellProps = {
  teacherName: string;
  children: React.ReactNode;
};

export function TeacherPortalShell({ teacherName, children }: TeacherPortalShellProps) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

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
              {teacherName}님 · 선생님 포털
            </p>
          </div>
          <div className="flex w-40 shrink-0 justify-end">
            <button
              type="button"
              onClick={() => signOut({ redirectTo: "/" })}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-mid transition hover:bg-background hover:text-text-dark"
            >
              로그아웃
            </button>
          </div>
        </div>
        <nav className="flex gap-6 overflow-x-auto border-t border-gray-100 px-4">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, "exact" in item ? item.exact : false);
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
