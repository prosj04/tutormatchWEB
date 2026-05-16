"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

import { NotificationBell } from "@/components/notifications/NotificationBell";

type DashboardTopBarProps = {
  studentName: string;
};

export function DashboardTopBar({ studentName }: DashboardTopBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-gray-200 bg-surface px-4 shadow-sm">
      <div className="flex w-40 shrink-0 items-center">
        <Link href="/" className="font-sans text-lg font-bold italic text-text-primary">
          Concord.
        </Link>
      </div>
      <div className="flex flex-1 justify-center">
        <p className="truncate text-sm font-semibold text-text-primary sm:text-base">
          {studentName}님의 학습 플래너
        </p>
      </div>
      <div className="flex w-44 shrink-0 items-center justify-end gap-1">
        <NotificationBell />
        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/" })}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:bg-background hover:text-text-primary"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
