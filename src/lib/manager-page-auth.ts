import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getTeacherByUserId } from "@/lib/get-teacher-cache";
import { prisma } from "@/lib/prisma";

export async function requireManagerPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "MANAGER" && session.user.role !== "CHIEF_MANAGER")) {
    redirect("/teacher-portal/dashboard");
  }

  const teacher = await getTeacherByUserId(session.user.id);

  if (!teacher) {
    redirect("/teacher-portal");
  }

  // 캐시(getTeacherByUserId)는 deletedAt/role 미포함 — 별도 재조회로
  // 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책)
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deletedAt: true, role: true },
  });
  if (!account || account.deletedAt !== null || account.role !== session.user.role) {
    redirect("/login");
  }

  return { session, teacher };
}
