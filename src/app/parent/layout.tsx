import "@/app/concord-portal.css";
import "@/app/concord-bridge.css";

import { PortalShell, type PortalNavItem } from "@/components/concord-portal/PortalShell";
import { requireParentPage } from "@/lib/parent-page-auth";

export const dynamic = "force-dynamic";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const NAV: PortalNavItem[] = [
  {
    href: "/parent",
    label: "대시보드",
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" /></svg>
    ),
  },
  {
    href: "/parent/reports",
    label: "리포트",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></svg>
    ),
  },
  {
    href: "/parent/payments",
    label: "결제",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
    ),
  },
  {
    href: "/parent/consultation",
    label: "상담",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    ),
  },
  {
    href: "/parent/link",
    label: "자녀 연결",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
    ),
  },
  {
    href: "/parent/account",
    label: "계정",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
    ),
  },
];

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { parent } = await requireParentPage();

  return (
    <PortalShell
      roleBadge="Parent · /parent"
      nav={NAV}
      userName={parent.name}
      userMeta="학부모"
    >
      {children}
    </PortalShell>
  );
}
