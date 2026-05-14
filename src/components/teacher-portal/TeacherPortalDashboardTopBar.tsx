"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

type Props = {
  displayName: string;
};

export function TeacherPortalDashboardTopBar({ displayName }: Props) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-navy/10 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/teacher-portal"
          className="shrink-0 text-lg font-semibold tracking-tight text-navy"
        >
          Concord.
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-center text-xs font-semibold text-navy sm:text-sm md:text-base">
          선생님 대시보드
        </h1>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden max-w-[7rem] truncate text-xs text-navy/70 sm:inline md:max-w-[14rem]">
            {displayName}님 환영합니다
          </span>
          <button
            type="button"
            onClick={() => void signOut({ redirectTo: "/teacher-portal" })}
            className="whitespace-nowrap rounded border border-navy/20 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-navy transition hover:border-navy/40 hover:bg-navy/[0.03] sm:px-3 sm:text-xs"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
