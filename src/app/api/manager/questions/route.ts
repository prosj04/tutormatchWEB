import { NextResponse } from "next/server";

import { requireManagerOrAbove } from "@/lib/admin-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

/** 담당 강사가 없는 학생들의 질문 인박스 — 매니저/치프/어드민 전용 */
export async function GET() {
  const authResult = await requireManagerOrAbove();
  if ("error" in authResult) return authResult.error;

  const roots = await prisma.questionMessage.findMany({
    where: {
      sender: "me",
      replyToId: null,
      replies: { none: { sender: "tutor" } },
      student: {
        deletedAt: null,
        name: { not: { startsWith: "[sample]" } },
        teachers: { none: { isActive: true } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      body: true,
      date: true,
      isResolved: true,
      createdAt: true,
      student: {
        select: { id: true, name: true, grade: true, phone: true, region: true },
      },
    },
  });

  return NextResponse.json({
    questions: roots.map((q) => ({
      id: q.id,
      body: q.body,
      date: q.date,
      isResolved: q.isResolved,
      createdAt: q.createdAt.toISOString(),
      student: q.student,
    })),
  });
}

export async function POST(request: Request) {
  const authResult = await requireManagerOrAbove();
  if ("error" in authResult) return authResult.error;

  let body: { questionId?: unknown; answer?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  if (!questionId || !answer) {
    return NextResponse.json({ error: "답변 내용을 입력해 주세요." }, { status: 400 });
  }

  const root = await prisma.questionMessage.findFirst({
    where: { id: questionId, sender: "me", replyToId: null },
    select: {
      id: true,
      studentId: true,
      student: { select: { userId: true } },
    },
  });
  if (!root) {
    return NextResponse.json({ error: "질문을 찾을 수 없습니다." }, { status: 404 });
  }

  const managerTeacher = await prisma.teacher.findUnique({
    where: { userId: authResult.userId },
    select: { id: true },
  });

  await prisma.questionMessage.create({
    data: {
      studentId: root.studentId,
      teacherId: managerTeacher?.id ?? null,
      sender: "tutor",
      body: answer,
      replyToId: root.id,
    },
  });

  await createNotification({
    userId: root.student.userId,
    type: "TEACHER_ANSWERED",
    title: "매니저가 답변했습니다",
    body: "등록하신 질문에 담당 매니저의 답변이 등록되었습니다.",
    relatedId: root.id,
  });

  return NextResponse.json({ ok: true });
}
