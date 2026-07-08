import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  const match = await prisma.teacherStudent.findUnique({ where: { id } });
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { isActive?: unknown; subjects?: unknown; startDate?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: {
    isActive?: boolean;
    matchStatus?: "ACTIVE" | "CANCELLED";
    subjects?: string;
    startDate?: string;
  } = {};
  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
    // 비활성화 = 취소. matchStatus를 함께 전이해 취소된 매칭이
    // 수락 대기 목록/알림에 재노출되지 않도록 한다.
    data.matchStatus = body.isActive ? "ACTIVE" : "CANCELLED";
  }
  if (typeof body.subjects === "string") data.subjects = body.subjects.trim();
  if (typeof body.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) {
    data.startDate = body.startDate;
  }

  const updated = await prisma.teacherStudent.update({
    where: { id },
    data,
    include: {
      teacher: { select: { id: true, name: true } },
      student: { select: { id: true, name: true, grade: true } },
    },
  });

  // 매칭을 취소하면 이 강사와의 예정된(미래) 수업도 취소 — 앱에 유령 수업이 남지 않도록.
  if (data.isActive === false) {
    await prisma.lesson.updateMany({
      where: {
        studentId: match.studentId,
        teacherId: match.teacherId,
        status: "SCHEDULED",
        startAt: { gte: new Date() },
      },
      data: { status: "CANCELLED", cancelledBy: "MANAGER" },
    });
  }

  return NextResponse.json({ match: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  const match = await prisma.teacherStudent.findUnique({ where: { id } });
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 매칭 삭제 시에도 이 강사와의 예정된(미래) 수업을 취소 — 유령 수업 방지.
  await prisma.lesson.updateMany({
    where: {
      studentId: match.studentId,
      teacherId: match.teacherId,
      status: "SCHEDULED",
      startAt: { gte: new Date() },
    },
    data: { status: "CANCELLED", cancelledBy: "MANAGER" },
  });

  await prisma.teacherStudent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
