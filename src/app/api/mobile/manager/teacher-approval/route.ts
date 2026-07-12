import { NextResponse } from "next/server";

import { requireMobileManager } from "@/lib/mobile-auth";
import { softDeleteUser } from "@/lib/account-deletion";
import { recordTeacherRejection } from "@/lib/teacher-rejection";
import { PUBLIC_TEACHERS_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";
import { prisma } from "@/lib/prisma";

type TeacherApprovalBody = {
  teacherId?: unknown;
  approve?: unknown;
  reason?: unknown;
};

export async function GET(request: Request) {
  const authResult = await requireMobileManager(request);
  if ("error" in authResult) return authResult.error;

  const pendingTeachers = await prisma.teacher.findMany({
    where: {
      approved: false,
      name: { not: { startsWith: "[sample]" } },
      user: { deletedAt: null },
    },
    orderBy: { user: { createdAt: "desc" } },
    select: {
      id: true,
      name: true,
      subjects: true,
      phone: true,
      user: { select: { email: true, createdAt: true } },
    },
  });

  return NextResponse.json({
    pendingTeachers: pendingTeachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.user.email,
      subjects: teacher.subjects,
      phone: teacher.phone,
      createdAt: teacher.user.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const authResult = await requireMobileManager(request);
  if ("error" in authResult) return authResult.error;

  let body: TeacherApprovalBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const teacherId = typeof body.teacherId === "string" ? body.teacherId : "";
  const approve = body.approve;
  // E-REJ-1: 반려 사유(내부 기록용) — 선택 입력. 없으면 undefined 유지.
  const reason = typeof body.reason === "string" ? body.reason.trim() || undefined : undefined;

  if (!teacherId || typeof approve !== "boolean") {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      userId: true,
      name: true,
      phone: true,
      approved: true,
      user: { select: { role: true, deletedAt: true } },
    },
  });
  if (!teacher || teacher.user.deletedAt) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  // 승인/거절은 '미승인 강사 지원서'에만 적용 — 승인된 강사·매니저·치프·어드민을
  // 이 엔드포인트로 소프트 삭제(계정 익명화+매칭/구독/수업 취소)하지 못하도록 차단.
  if (teacher.approved || teacher.user.role !== "TEACHER") {
    return NextResponse.json(
      { error: "미승인 강사 지원서에만 처리할 수 있습니다." },
      { status: 409 },
    );
  }

  if (approve) {
    await prisma.teacher.update({
      where: { id: teacherId },
      data: { approved: true },
    });
  } else {
    // E-REJ-1: 반려 사유 감사 기록 + 강사 통지(소프트 삭제로 phone 익명화되기 전에).
    await recordTeacherRejection({
      actorUserId: authResult.userId,
      actorRole: authResult.role,
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherPhone: teacher.phone,
      reason,
    });
    // 거절 = 소프트 삭제(감사/복구 가능). 하드 delete는 연관 데이터가 함께 사라짐.
    await softDeleteUser(teacher.userId);
  }

  revalidatePublicCms(PUBLIC_TEACHERS_CACHE_TAG);
  return NextResponse.json({ ok: true });
}
