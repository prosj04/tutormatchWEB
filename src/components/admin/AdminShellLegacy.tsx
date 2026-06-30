"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

const NAV = [
  { href: "/admin", label: "대시보드", exact: true },
  { href: "/admin/funnel", label: "전환 퍼널" },
  { href: "/admin/students", label: "학생 관리" },
  { href: "/admin/teachers", label: "선생님 관리" },
  { href: "/admin/matches", label: "매칭 관리" },
  { href: "/admin/cms", label: "사이트 콘텐츠" },
  { href: "/admin/data", label: "전체 데이터" },
];

type AdminShellLegacyProps = {
  email: string;
  children: React.ReactNode;
};

/** 기존 Tailwind 관리자 셸 — NEXT_PUBLIC_PORTAL_DESIGN=legacy 시 사용 */
export function AdminShellLegacy({ email, children }: AdminShellLegacyProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  const activeLabel = useMemo(() => {
    const activeItem = NAV.find((item) =>
      item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
    return activeItem?.label ?? "관리자 패널";
  }, [pathname]);

  function renderNav(onNavigate?: () => void) {
    return NAV.map((item) => {
      const external = "external" in item && item.external;
      const active =
        !external &&
        (item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`));
      const className = `block rounded-xl px-3 py-3 text-sm font-medium transition ${
        active
          ? "bg-primary text-white shadow-sm"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`;

      return external ? (
        <a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className={className}
          onClick={onNavigate}
        >
          {item.label}
        </a>
      ) : (
        <Link key={item.href} href={item.href} className={className} onClick={onNavigate}>
          {item.label}
        </Link>
      );
    });
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="hidden w-56 shrink-0 flex-col bg-text-primary text-white md:flex">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="text-lg font-bold">과외플랫폼</p>
          <p className="mt-1 text-xs text-white/60">Admin</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">{renderNav()}</nav>
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition md:hidden ${
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden={!mobileNavOpen}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col bg-text-primary text-white transition-transform duration-300 md:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileNavOpen}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div>
            <p className="text-lg font-bold">과외플랫폼</p>
            <p className="mt-1 text-xs text-white/60">Admin</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white"
            aria-label="메뉴 닫기"
          >
            닫기
          </button>
        </div>
        <div className="border-b border-white/10 px-5 py-4">
          <p className="truncate text-sm font-semibold text-white">{email}</p>
          <p className="mt-1 text-xs text-white/70">{activeLabel}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {renderNav(() => setMobileNavOpen(false))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-text-primary md:hidden"
              aria-label="메뉴 열기"
            >
              <span className="space-y-1">
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
              </span>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-text-primary sm:text-base">관리자 패널</h1>
              <p className="truncate text-xs text-text-muted md:hidden">{activeLabel}</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <span className="hidden max-w-[220px] truncate text-sm text-text-secondary sm:block">
              {email}
            </span>
            <button
              type="button"
              onClick={() => signOut({ redirectTo: "/login" })}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-secondary transition hover:bg-background hover:text-text-primary"
            >
              로그아웃
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
