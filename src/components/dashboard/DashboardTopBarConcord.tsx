"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConcordPortalThemeControls } from "@/components/concord/ConcordPortalThemeControls";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";

type DashboardTopBarConcordProps = {
  studentName: string;
  isEditMode?: boolean;
};

export function DashboardTopBarConcord({ studentName, isEditMode = false }: DashboardTopBarConcordProps) {
  const brand = usePortalCopy("student_dashboard", "brand", "Concord.");
  const plannerSuffix = usePortalCopy("student_dashboard", "planner_title_suffix", "님의 학습 플래너");
  const logoutLabel = usePortalCopy("student_dashboard", "logout", "로그아웃");

  return (
    <header className="portal-topbar">
      <div className="portal-topbar-inner">
        <Link href="/dashboard" className="portal-topbar-brand">
          <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="brand" type="text">
            {brand.endsWith(".") ? brand.slice(0, -1) : brand}
            <span>.</span>
          </CmsEdit>
        </Link>
        <p className="portal-topbar-title">
          {studentName}
          <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="planner_title_suffix" type="text">
            {plannerSuffix}
          </CmsEdit>
        </p>
        <div className="portal-topbar-actions">
          <ConcordPortalThemeControls />
          <NotificationBell />
          <Link href="/dashboard/account" className="btn btn-ghost btn-sm hidden md:inline-flex">
            계정
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => signOut({ redirectTo: "/" })}>
            <span className="md:hidden">나가기</span>
            <span className="hidden md:inline">
              <CmsEdit active={isEditMode} section="student_dashboard" cmsKey="logout" type="text">
                {logoutLabel}
              </CmsEdit>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
