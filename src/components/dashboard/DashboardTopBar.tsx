"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";

type DashboardTopBarProps = {
  studentName: string;
};

export function DashboardTopBar({ studentName }: DashboardTopBarProps) {
  const brand = usePortalCopy("student_dashboard", "brand", "Concord.");
  const plannerSuffix = usePortalCopy("student_dashboard", "planner_title_suffix", "님의 학습 플래너");
  const logoutLabel = usePortalCopy("student_dashboard", "logout", "로그아웃");

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-gray-200 bg-surface px-4 shadow-sm">
      <div className="flex min-w-0 flex-1 items-center md:w-40 md:max-w-[10rem] md:flex-none">
        <Link href="/dashboard" className="truncate font-sans text-base font-bold italic text-text-primary sm:text-lg">
          {brand}
        </Link>
      </div>
      <div className="flex min-w-0 flex-1 justify-center">
        <p className="truncate text-center text-sm font-semibold text-text-primary sm:text-base">
          {studentName}
          {plannerSuffix}
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1 md:w-44">
        <NotificationBell />
        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/" })}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-background hover:text-text-primary sm:px-3 sm:text-sm"
        >
          <span className="sm:hidden">나가기</span>
          <span className="hidden sm:inline">{logoutLabel}</span>
        </button>
      </div>
    </header>
  );
}
