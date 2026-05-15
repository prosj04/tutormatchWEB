"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin", label: "대시보드", exact: true },
  { href: "/admin/students", label: "학생 관리" },
  { href: "/admin/teachers", label: "선생님 관리" },
  { href: "/admin/matches", label: "매칭 관리" },
  { href: "/admin/data", label: "전체 데이터" },
];

type AdminShellProps = {
  email: string;
  children: React.ReactNode;
};

export function AdminShell({ email, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-56 shrink-0 flex-col bg-navy text-white">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="font-display text-lg font-bold italic">Concord.</p>
          <p className="mt-1 text-xs text-white/60">Admin</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
          <h1 className="text-sm font-semibold text-text-dark">관리자 패널</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-mid">{email}</span>
            <button
              type="button"
              onClick={() => signOut({ redirectTo: "/login" })}
              className="text-sm font-medium text-text-mid hover:text-text-dark"
            >
              로그아웃
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
