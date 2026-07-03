import { NextResponse } from "next/server";

import { isAiAnswerEnabled, MOCK_AI_ANSWER } from "@/lib/ai-answer";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { askQuestion, answerAsAi, listStudentQuestions } from "@/lib/qna";
import { isValidDateString, requireStudent } from "@/lib/student-auth";

export async function GET(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !isValidDateString(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const questions = await listStudentQuestions(student.id, { date });

  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let body: { date?: unknown; content?: unknown; imageUrl?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, content, imageUrl } = body;

  if (typeof date !== "string" || !isValidDateString(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== "string") {
    return NextResponse.json({ error: "Invalid imageUrl" }, { status: 400 });
  }

  const root = await askQuestion({
    studentId: student.id,
    content: content.trim(),
    imageUrl: typeof imageUrl === "string" ? imageUrl : null,
    date,
  });

  // AI가 아직 활성화 전이라면 모의 AI 답변을 즉시 붙여 준다 (UI 하위호환).
  if (!isAiAnswerEnabled()) {
    await answerAsAi({
      studentId: student.id,
      teacherId: root.teacherId,
      rootMessageId: root.id,
      body: MOCK_AI_ANSWER,
    });
  }

  const matches = await prisma.teacherStudent.findMany({
    where: { studentId: student.id, isActive: true },
    select: { teacher: { select: { userId: true } } },
  });

  await Promise.all(
    matches.map((m) =>
      createNotification({
        userId: m.teacher.userId,
        type: "NEW_QUESTION",
        title: "새 질문이 등록되었습니다",
        body: `${student.name} 학생이 새 질문을 등록했습니다.`,
        relatedId: root.id,
      }),
    ),
  );

  // 웹 UI는 레거시 Question 셰이프를 기대한다.
  const question = {
    id: root.id,
    studentId: root.studentId,
    date: root.date ?? date,
    content: root.body,
    imageUrl: root.imageUrl,
    aiAnswer: isAiAnswerEnabled() ? null : MOCK_AI_ANSWER,
    teacherAnswer: null as string | null,
    teacherAnswerAt: null as string | null,
    answeredBy: null as string | null,
    isResolved: root.isResolved,
    createdAt: root.createdAt,
  };

  return NextResponse.json({ question }, { status: 201 });
}
