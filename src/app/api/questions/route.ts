import { NextResponse } from "next/server";

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

  return NextResponse.json({ question }, { status: 201 });
}
