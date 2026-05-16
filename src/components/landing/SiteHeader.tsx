"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

function displayName(session: { user?: { name?: string | null; email?: string | null } }) {
  const n = session.user?.name?.trim();
  if (n) return n;
  const email = session.user?.email;
  if (email) return email.split("@")[0] ?? email;
  return "회원";
}

export function SiteHeader() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-8">
        <Link href="/" className="text-lg font-bold text-text-primary">
          과외플랫폼
        </Link>

        {status === "loading" ? (
          <div className="flex items-center gap-2">
            <span className="h-8 w-16 animate-pulse rounded-lg bg-gray-200" />
            <span className="h-10 w-28 animate-pulse rounded-lg bg-gray-200" />
          </div>
        ) : status === "authenticated" && session?.user ? (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-text-primary sm:inline">
              {displayName(session)}님
            </span>
            {role === "TEACHER" || role === "MANAGER" ? (
              <Link
                href="/teacher-portal/dashboard"
                className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
              >
                선생님 포털
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void signOut({ redirectTo: "/" })}
              className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
            >
              로그인
            </Link>
            <Link
              href="/dashboard/consultation"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              무료 상담 예약
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
