"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

import { ConcordPortalThemeControls } from "@/components/concord/ConcordPortalThemeControls";

export function PaymentsPageHeader({ studentName }: { studentName: string }) {
  return (
    <header className="portal-topbar">
      <div className="portal-topbar-inner">
        <Link href="/dashboard" className="portal-topbar-brand">
          Concord<span>.</span>
        </Link>
        <p className="portal-topbar-title">{studentName}님의 결제 내역</p>
        <div className="portal-topbar-actions">
          <ConcordPortalThemeControls />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => signOut({ redirectTo: "/" })}
          >
            <span className="md:hidden">나가기</span>
            <span className="hidden md:inline">로그아웃</span>
          </button>
        </div>
      </div>
    </header>
  );
}
