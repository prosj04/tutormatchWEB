import { redirect } from "next/navigation";

import "@/app/concord-portal.css";
import "@/app/concord-bridge.css";

import { PortalShell, type PortalNavItem } from "@/components/concord-portal/PortalShell";
import { PortalSiteContentProvider } from "@/components/providers/PortalSiteContentProvider";
import { auth } from "@/auth";
import { isPortalTeacherRole } from "@/lib/portal-roles";
import { getTeacherByUserId } from "@/lib/get-teacher-cache";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

export const dynamic = "force-dynamic";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const TEACHER_NAV: PortalNavItem[] = [
  {
    href: "/teacher-portal/dashboard",
    label: "대시보드",
    icon: <svg viewBox="0 0 24 24" {...stroke}><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" /></svg>,
  },
  {
    href: "/teacher-portal/dashboard/students",
    label: "학생",
    prefix: true,
    icon: <svg viewBox="0 0 24 24" {...stroke}><path d="M2 7l10-4 10 4-10 4z" /><path d="M6 10v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></svg>,
  },
  {
    href: "/teacher-portal/dashboard/plans",
    label: "진도·숙제",
    prefix: true,
    icon: <svg viewBox="0 0 24 24" {...stroke}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></svg>,
  },
  {
    href: "/teacher-portal/dashboard/questions",
    label: "질문",
    prefix: true,
    icon: <svg viewBox="0 0 24 24" {...stroke}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  },
];

const MANAGER_NAV: PortalNavItem[] = [
  {
    href: "/teacher-portal/dashboard/consultations",
    label: "상담 관리",
    prefix: true,
    icon: <svg viewBox="0 0 24 24" {...stroke}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /></svg>,
  },
  {
    href: "/teacher-portal/dashboard/matching",
    label: "매칭",
    prefix: true,
    icon: <svg viewBox="0 0 24 24" {...stroke}><path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7" /></svg>,
  },
  {
    href: "/teacher-portal/dashboard/monitoring",
    label: "모니터링",
    prefix: true,
    icon: <svg viewBox="0 0 24 24" {...stroke}><path d="M3 3v18h18" /><path d="m7 14 4-4 4 3 5-6" /></svg>,
  },
];

const PROFILE_NAV: PortalNavItem = {
  href: "/teacher-portal/dashboard/profile",
  label: "프로필",
  prefix: true,
  icon: <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>,
};

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || !isPortalTeacherRole(session.user.role)) {
    redirect("/teacher-portal");
  }

  const teacher = await getTeacherByUserId(session.user.id);

  if (!teacher) {
    redirect("/teacher-portal");
  }

  const siteContent = await getGroupedSiteContentBySections(["teacher_portal"]);

  const isManager = session.user.role !== "TEACHER";
  const nav: PortalNavItem[] = [
    ...TEACHER_NAV,
    ...(isManager ? MANAGER_NAV : []),
    PROFILE_NAV,
  ];

  const subjectsLabel = teacher.subjects
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" · ");
  const userMeta = `${teacher.approved ? "승인됨" : "승인 대기"}${
    subjectsLabel ? ` · ${subjectsLabel}` : ""
  }`;

  return (
    <PortalSiteContentProvider value={siteContent}>
      <PortalShell
        roleBadge={isManager ? "Manager · /teacher-portal" : "Teacher · /teacher-portal"}
        nav={nav}
        userName={teacher.name}
        userMeta={userMeta}
      >
        {children}
      </PortalShell>
    </PortalSiteContentProvider>
  );
}
