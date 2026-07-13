import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

const PARENT_SELECT = {
  id: true,
  name: true,
  phone: true,
  deletedAt: true,
  user: { select: { deletedAt: true, role: true } },
} as const;

/**
 * 웹 학부모 페이지 가드. 세션이 PARENT가 아니면 로그인으로,
 * Parent 레코드가 없으면 로그인으로 보낸다.
 */
export async function requireParentPage() {
  const guard = await requireRole(["PARENT"]);
  if ("error" in guard) redirect("/login");

  const parent = await prisma.parent.findUnique({
    where: { userId: guard.userId },
    select: PARENT_SELECT,
  });
  // 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책)
  if (
    !parent ||
    parent.deletedAt !== null ||
    parent.user.deletedAt !== null ||
    parent.user.role !== guard.session.user.role
  ) {
    redirect("/login");
  }

  return { session: guard.session, parent };
}

/**
 * 학부모 API 가드(라우트 핸들러용). 실패 시 error 응답 반환.
 * `if ("error" in r) return r.error` 패턴으로 사용.
 */
export async function requireParent() {
  const guard = await requireRole(["PARENT"]);
  if ("error" in guard) return guard;

  const parent = await prisma.parent.findUnique({
    where: { userId: guard.userId },
    select: PARENT_SELECT,
  });
  if (!parent) {
    return {
      error: NextResponse.json({ error: "Parent not found" }, { status: 404 }),
    } as const;
  }
  // 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책)
  if (
    parent.deletedAt !== null ||
    parent.user.deletedAt !== null ||
    parent.user.role !== guard.session.user.role
  ) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  return { session: guard.session, parent, userId: guard.userId } as const;
}

/** 학부모가 특정 자녀에 접근 가능한지 확인(서버 컴포넌트/액션용). */
export async function parentOwnsStudent(parentId: string, studentId: string) {
  const link = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId, studentId } },
    select: { id: true },
  });
  return Boolean(link);
}
