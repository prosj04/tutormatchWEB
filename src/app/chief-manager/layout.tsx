import "@/app/concord-portal.css";
import "@/app/concord-bridge.css";
import "@/app/concord-admin.css";

import { redirect } from "next/navigation";

import { PortalShell, type PortalNavItem } from "@/components/concord-portal/PortalShell";
import { auth } from "@/auth";

export const metadata = {
  title: "치프 매니저",
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const NAV: PortalNavItem[] = [
  {
    href: "/admin",
    label: "대시보드",
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" /></svg>
    ),
  },
  {
    href: "/admin/metrics",
    label: "지표",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M3 3v18h18" /><path d="m7 14 4-4 4 3 5-6" /></svg>
    ),
  },
  {
    href: "/admin/funnel",
    label: "퍼널",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M3 4h18l-7 8v6l-4 2v-8z" /></svg>
    ),
  },
  {
    href: "/admin/leads",
    label: "상담 리드",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /></svg>
    ),
  },
  {
    href: "/admin/students",
    label: "학생",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M2 7l10-4 10 4-10 4z" /><path d="M6 10v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></svg>
    ),
  },
  {
    href: "/admin/teachers",
    label: "선생님",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
    ),
  },
  {
    href: "/admin/matches",
    label: "매칭",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7" /></svg>
    ),
  },
  {
    href: "/admin/payments",
    label: "결제",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
    ),
  },
  {
    href: "/admin/settlements",
    label: "정산",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M12 2v20M17 6H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6" /></svg>
    ),
  },
  {
    href: "/admin/cms",
    label: "CMS",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
    ),
  },
  {
    href: "/admin/data",
    label: "데이터",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3" /></svg>
    ),
  },
  {
    href: "/admin/audit-logs",
    label: "감사 로그",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
    ),
  },
  {
    href: "/chief-manager/teacher-approval",
    label: "치프 승인",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
    ),
  },
];

export default async function ChiefManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "CHIEF_MANAGER")) {
    redirect("/login");
  }

  return (
    <PortalShell
      roleBadge="Admin · /admin"
      nav={NAV}
      userName={session.user.name ?? session.user.email ?? "관리자"}
      userMeta={session.user.role === "CHIEF_MANAGER" ? "CHIEF_MANAGER" : "ADMIN"}
    >
      {children}
    </PortalShell>
  );
}
