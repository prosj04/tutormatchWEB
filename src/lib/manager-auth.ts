import { NextResponse } from "next/server";

import { getTeacherByUserId } from "@/lib/get-teacher-cache";
import { requireRole, revalidateUser } from "@/lib/require-role";

export async function requireManager() {
  const guard = await requireRole(["ADMIN", "MANAGER", "CHIEF_MANAGER"]);
  if ("error" in guard) return guard;

  const teacher = await getTeacherByUserId(guard.userId);

  if (!teacher) {
    return {
      error: NextResponse.json({ error: "Manager not found" }, { status: 404 }),
    } as const;
  }

  // 캐시(getTeacherByUserId)는 deletedAt/role을 담지 않으므로 별도 재조회로
  // 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책)
  const invalid = await revalidateUser(guard.session.user.role, guard.userId);
  if (invalid) return { error: invalid } as const;

  return { session: guard.session, teacher, userId: guard.userId } as const;
}
