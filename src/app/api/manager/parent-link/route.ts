import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { linkParentManual } from "@/lib/parent-link";
import { normalizePhoneDigits } from "@/lib/phone-login";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/manager/parent-link — 매니저 수동 학부모↔학생 연결.
 * body: { studentId, parentId? , parentPhone? } — parentId 우선, 없으면 전화번호로 조회.
 */
export async function POST(request: Request) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;

  let body: { studentId?: unknown; parentId?: unknown; parentPhone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const studentId = typeof body.studentId === "string" ? body.studentId : "";
  if (!studentId) {
    return NextResponse.json({ error: "studentId가 필요합니다." }, { status: 400 });
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: { id: true },
  });
  if (!student) {
    return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  }

  let parentId = typeof body.parentId === "string" ? body.parentId : "";
  if (!parentId && typeof body.parentPhone === "string") {
    const digits = normalizePhoneDigits(body.parentPhone);
    const parent = await prisma.parent.findFirst({
      where: { phone: digits, deletedAt: null },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json({ error: "해당 전화번호의 학부모 계정이 없습니다." }, { status: 404 });
    }
    parentId = parent.id;
  }

  if (!parentId) {
    return NextResponse.json({ error: "parentId 또는 parentPhone이 필요합니다." }, { status: 400 });
  }

  const parentExists = await prisma.parent.findFirst({
    where: { id: parentId, deletedAt: null },
    select: { id: true },
  });
  if (!parentExists) {
    return NextResponse.json({ error: "학부모를 찾을 수 없습니다." }, { status: 404 });
  }

  const result = await linkParentManual(parentId, studentId);
  return NextResponse.json({ ok: true, alreadyLinked: result.alreadyLinked }, { status: 201 });
}
