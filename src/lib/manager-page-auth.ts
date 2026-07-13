import { redirect } from "next/navigation";

import { getTeacherByUserId } from "@/lib/get-teacher-cache";
import { requireRole, revalidateUser } from "@/lib/require-role";

export async function requireManagerPage() {
  const guard = await requireRole(["MANAGER", "CHIEF_MANAGER"]);
  if ("error" in guard) redirect("/teacher-portal/dashboard");

  const teacher = await getTeacherByUserId(guard.userId);

  if (!teacher) {
    redirect("/teacher-portal");
  }

  // 캐시(getTeacherByUserId)는 deletedAt/role 미포함 — 별도 재조회로
  // 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책)
  const invalid = await revalidateUser(guard.session.user.role, guard.userId);
  if (invalid) {
    redirect("/login");
  }

  return { session: guard.session, teacher };
}
