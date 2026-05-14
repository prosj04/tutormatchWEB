"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

function sectionMeta(pathname: string): { label: string; title: string } {
  if (pathname === "/") return { label: "01", title: "홈" };
  if (pathname.startsWith("/tutors/")) return { label: "02", title: "강사 프로필" };
  if (pathname === "/tutors") return { label: "02", title: "강사진" };
  if (pathname === "/pricing") return { label: "03", title: "요금제" };
  if (pathname === "/checkout") return { label: "04", title: "결제" };
  if (pathname === "/success") return { label: "05", title: "완료" };
  if (pathname === "/login") return { label: "—", title: "로그인" };
  if (pathname === "/register") return { label: "—", title: "회원가입" };
  return { label: "—", title: "Concord" };
}

function displayName(session: { user?: { name?: string | null; email?: string | null } }) {
  const n = session.user?.name?.trim();
  if (n) return n;
  const email = session.user?.email;
  if (email) return email.split("@")[0] ?? email;
  return "회원";
}

export function SiteHeader() {
  const pathname = usePathname();
  const { label, title } = sectionMeta(pathname);
  const { data: session, status } = useSession();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:gap-6 sm:px-8">
        <p className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wider text-text-mid">
          <span className="text-text-light">{label}</span> {title}
        </p>
        <div className="flex shrink-0 items-center gap-3 sm:gap-6">
          <nav className="hidden items-center gap-6 text-xs font-medium uppercase tracking-wider text-text-mid md:flex">
            <Link href="/tutors" className="transition hover:text-primary">
              강사진
            </Link>
            <Link href="/pricing" className="transition hover:text-primary">
              요금제
            </Link>
            <Link
              href="/checkout"
              className="rounded-full border border-gray-200 px-3 py-1.5 transition hover:border-primary hover:text-primary"
            >
              등록
            </Link>
          </nav>

          {status === "loading" ? (
            <div className="flex items-center gap-2">
              <span className="h-7 w-14 animate-pulse rounded-full bg-gray-200/80" />
              <span className="h-7 w-16 animate-pulse rounded-full bg-gold/30" />
            </div>
          ) : status === "authenticated" && session?.user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden max-w-[8rem] truncate text-xs font-medium text-text-dark sm:inline">
                {displayName(session)}님
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  session.user.role === "TEACHER"
                    ? "bg-navy/10 text-navy"
                    : "bg-gold/20 text-navy"
                }`}
              >
                {session.user.role === "TEACHER" ? "선생님" : "학생"}
              </span>
              <button
                type="button"
                onClick={() => void signOut({ redirectTo: "/" })}
                className="whitespace-nowrap rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-text-mid transition hover:border-navy hover:text-navy sm:px-3 sm:text-xs"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="whitespace-nowrap rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-text-mid transition hover:border-navy hover:text-navy sm:px-3 sm:text-xs"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="whitespace-nowrap rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold text-navy transition hover:bg-gold/90 sm:px-3 sm:text-xs"
              >
                회원가입
              </Link>
            </div>
          )}

          <Link href="/" className="text-lg font-bold italic text-text-dark">
            Concord.
          </Link>
        </div>
      </div>
    </header>
  );
}
