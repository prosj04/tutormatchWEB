import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * 웹 학부모 페이지 가드. 세션이 PARENT가 아니면 로그인으로,
 * Parent 레코드가 없으면 로그인으로 보낸다.
 */
export async function requireParentPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PARENT") {
    redirect("/login");
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      phone: true,
      deletedAt: true,
      user: { select: { deletedAt: true, role: true } },
    },
  });
  // 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책)
  if (
    !parent ||
    parent.deletedAt !== null ||
    parent.user.deletedAt !== null ||
    parent.user.role !== session.user.role
  ) {
    redirect("/login");
  }

  return { session, parent };
}

/**
 * 학부모 API 가드(라우트 핸들러용). 실패 시 error 응답 반환.
 * `if ("error" in r) return r.error` 패턴으로 사용.
 */
export async function requireParent() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (session.user.role !== "PARENT") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      phone: true,
      deletedAt: true,
      user: { select: { deletedAt: true, role: true } },
    },
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
    parent.user.role !== session.user.role
  ) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  return { session, parent, userId: session.user.id } as const;
}

/** 학부모가 특정 자녀에 접근 가능한지 확인(서버 컴포넌트/액션용). */
export async function parentOwnsStudent(parentId: string, studentId: string) {
  const link = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId, studentId } },
    select: { id: true },
  });
  return Boolean(link);
}
