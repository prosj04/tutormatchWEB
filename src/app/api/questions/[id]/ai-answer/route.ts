import { NextResponse } from "next/server";

import { generateAiAnswer } from "@/lib/ai-answer";
import { prisma } from "@/lib/prisma";
import { answerAsAi } from "@/lib/qna";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireStudent } from "@/lib/student-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  // Anthropic API 호출 라우트 — 학생당 분당 5회 제한
  if (!checkRateLimit("ai-answer", student.id, { windowMs: 60_000, max: 5 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await context.params;

  const root = await prisma.questionMessage.findFirst({
    where: {
      id,
      studentId: student.id,
      sender: "me",
      replyToId: null,
    },
    select: {
      id: true,
      body: true,
      imageUrl: true,
      teacherId: true,
      replies: {
        where: { sender: "ai" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { body: true },
      },
    },
  });

  if (!root) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const existingAi = root.replies[0];
  if (existingAi) {
    return NextResponse.json({ aiAnswer: existingAi.body });
  }

  const aiAnswer = await generateAiAnswer(root.body, root.imageUrl);

  await answerAsAi({
    studentId: student.id,
    teacherId: root.teacherId,
    rootMessageId: root.id,
    body: aiAnswer,
  });

  return NextResponse.json({ aiAnswer });
}
