import { NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
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

  const questions = await prisma.question.findMany({
    where: { studentId: student.id, date },
    orderBy: { createdAt: "desc" },
  });

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

  const question = await prisma.question.create({
    data: {
      studentId: student.id,
      date,
      content: content.trim(),
      imageUrl: typeof imageUrl === "string" ? imageUrl : null,
    },
  });

  const matches = await prisma.teacherStudent.findMany({
    where: { studentId: student.id, isActive: true },
    include: { teacher: { include: { user: true } } },
  });

  await Promise.all(
    matches.map((m) =>
      createNotification({
        userId: m.teacher.userId,
        type: "NEW_QUESTION",
        title: "새 질문이 등록되었습니다",
        body: `${student.name} 학생이 새 질문을 등록했습니다.`,
        relatedId: question.id,
      }),
    ),
  );

  return NextResponse.json({ question }, { status: 201 });
}
