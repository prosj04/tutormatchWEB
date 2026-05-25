import { NextResponse } from "next/server";

import { generateAiAnswer } from "@/lib/ai-answer";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/student-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { id } = await context.params;

  const question = await prisma.question.findFirst({
    where: { id, studentId: student.id },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  if (question.aiAnswer) {
    return NextResponse.json({ aiAnswer: question.aiAnswer });
  }

  const aiAnswer = await generateAiAnswer(question.content, question.imageUrl);

  await prisma.question.update({
    where: { id },
    data: { aiAnswer },
  });

  return NextResponse.json({ aiAnswer });
}
