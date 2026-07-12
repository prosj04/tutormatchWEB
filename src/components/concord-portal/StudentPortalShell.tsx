import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { portalHomeHref } from "@/lib/portal-roles";
import { prisma } from "@/lib/prisma";

import { PortalShell, type PortalNavItem } from "./PortalShell";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** 시안 "Concord - 웹 학생.html" 사이드바 항목·아이콘 순서 그대로. */
const NAV: PortalNavItem[] = [
  {
    href: "/dashboard",
    label: "홈",
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" /></svg>
    ),
  },
  {
    href: "/dashboard/consultation",
    label: "상담 예약",
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    ),
  },
  {
    href: "/questions",
    label: "질문",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    ),
  },
  {
    href: "/notifications",
    label: "알림",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
    ),
  },
  {
    href: "/payments",
    label: "결제 내역",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
    ),
  },
  {
    href: "/dashboard/reports",
    label: "리포트",
    prefix: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13l2 2 4-4" /></svg>
    ),
  },
  {
    href: "/dashboard/account",
    label: "계정",
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
    ),
  },
];

/**
 * 학생 웹 포털 공용 셸. 세션이 STUDENT가 아니면 로그인/선생님 포털로 보내고,
 * PortalShell(시안 .shell 구조)에 학생 nav를 주입한다.
 */
export async function StudentPortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect(portalHomeHref(session.user.role));
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      grade: true,
      user: { select: { deletedAt: true, role: true } },
    },
  });
  if (!student) {
    redirect("/?signup=1");
  }
  // 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책)
  if (student.user.deletedAt !== null || student.user.role !== session.user.role) {
    redirect("/login");
  }

  const [unreadNotif, openQuestions] = await Promise.all([
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
    prisma.question.count({
      where: { studentId: student.id, isResolved: false },
    }),
  ]);

  const nav = NAV.map((item) => {
    if (item.href === "/notifications") return { ...item, cnt: unreadNotif };
    if (item.href === "/questions") return { ...item, cnt: openQuestions };
    return item;
  });

  return (
    <PortalShell
      roleBadge="Student · /dashboard"
      nav={nav}
      userName={student.name}
      userMeta={student.grade ? `${student.grade} · 수업중` : "수업중"}
    >
      {children}
    </PortalShell>
  );
}
