import { NextResponse } from "next/server";

import { generateAiAnswer, isAiAnswerEnabled } from "@/lib/ai-answer";
import { requireMobileStudent } from "@/lib/mobile-auth";
import { consumeToken, getTokenWallet } from "@/lib/mobile-token-wallet";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

/** GET /api/mobile/qna/[tutorId] — 강사별 Q&A 대화 + 토큰 잔여 */
export async function GET(
  request: Request,
  { params }: { params: { tutorId: string } },
) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const [messages, wallet] = await Promise.all([
    prisma.questionMessage.findMany({
      where: { studentId: student.id, teacherId: params.tutorId },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: {
        id: true,
        sender: true,
        body: true,
        imageUrl: true,
        tokenCost: true,
        createdAt: true,
      },
    }),
    getTokenWallet(student.id),
  ]);

  return NextResponse.json({ messages, wallet });
}

/** POST /api/mobile/qna/[tutorId] — 메시지 전송 (+ AI 즉답, 토큰 1 차감) */
export async function POST(
  request: Request,
  { params }: { params: { tutorId: string } },
) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let body: { content?: unknown; imageUrl?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : null;
  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  // 배정된(활성 매칭) 선생님에게만 질문 가능 — 임의 강사에게 알림/토큰 남용 차단
  const match = await prisma.teacherStudent.findFirst({
    where: { studentId: student.id, teacherId: params.tutorId, isActive: true },
    select: { teacher: { select: { id: true, userId: true } } },
  });
  if (!match) {
    return NextResponse.json(
      { error: "배정된 선생님에게만 질문할 수 있습니다." },
      { status: 403 },
    );
  }
  const teacher = match.teacher;

  const myMessage = await prisma.questionMessage.create({
    data: {
      studentId: student.id,
      teacherId: teacher.id,
      sender: "me",
      body: content,
      imageUrl,
      replyToId: null,
    },
    select: {
      id: true,
      sender: true,
      body: true,
      imageUrl: true,
      tokenCost: true,
      createdAt: true,
    },
  });

  await createNotification({
    userId: teacher.userId,
    type: "NEW_QUESTION",
    title: "새 질문이 등록되었습니다",
    body: `${student.name} 학생이 새 질문을 보냈습니다.`,
    relatedId: myMessage.id,
  });

  // AI 즉답 (토큰 1 차감, 잔여 부족하면 생략)
  let aiMessage = null;
  const { ok, wallet } = await consumeToken(student.id, 1);
  if (ok && isAiAnswerEnabled()) {
    const aiText = await generateAiAnswer(content, imageUrl);
    aiMessage = await prisma.questionMessage.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        sender: "ai",
        body: aiText,
        tokenCost: 1,
        replyToId: myMessage.id,
      },
      select: {
        id: true,
        sender: true,
        body: true,
        imageUrl: true,
        tokenCost: true,
        createdAt: true,
      },
    });
  }

  return NextResponse.json(
    { message: myMessage, aiMessage, wallet },
    { status: 201 },
  );
}
