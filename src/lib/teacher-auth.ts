import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

/**
 * 강사 신원 확인만 수행(승인 여부 무관).
 * 승인 대기 중인 강사도 접근해야 하는 온보딩 라우트(프로필/문서/사진)용.
 */
export async function requireTeacherAllowPending() {
  const guard = await requireRole(["TEACHER", "MANAGER", "CHIEF_MANAGER"]);
  if ("error" in guard) return guard;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: guard.userId },
    include: { user: { select: { deletedAt: true, role: true } } },
  });

  if (!teacher) {
    return {
      error: NextResponse.json({ error: "Teacher not found" }, { status: 404 }),
    } as const;
  }

  // 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책)
  if (teacher.user.deletedAt !== null || teacher.user.role !== guard.session.user.role) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  return { session: guard.session, teacher, userId: guard.userId } as const;
}

/**
 * 승인된 강사만 통과(운영 라우트 — 학생/수업/숙제/플랜 등).
 * MANAGER/CHIEF_MANAGER는 상위 권한이므로 approved 값과 무관하게 통과.
 */
export async function requireTeacher() {
  const result = await requireTeacherAllowPending();
  if ("error" in result) return result;

  if (result.session.user.role === "TEACHER" && !result.teacher.approved) {
    return {
      error: NextResponse.json(
        { error: "승인 대기 중입니다. 관리자 승인 후 이용할 수 있습니다." },
        { status: 403 },
      ),
    } as const;
  }

  return result;
}
