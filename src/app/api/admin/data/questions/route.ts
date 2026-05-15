import { NextResponse } from "next/server";

import { parsePagination, requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const q = searchParams.get("q")?.trim() ?? "";
  const from = searchParams.get("from")?.trim() ?? "";
  const to = searchParams.get("to")?.trim() ?? "";
  const resolved = searchParams.get("resolved");

  const where = {
    AND: [
      q ? { student: { name: { contains: q, mode: "insensitive" as const } } } : {},
      from ? { date: { gte: from } } : {},
      to ? { date: { lte: to } } : {},
      resolved === "true" ? { isResolved: true } : {},
      resolved === "false" ? { isResolved: false } : {},
    ],
  };

  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { student: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({
    questions: questions.map((q) => ({
      id: q.id,
      studentName: q.student.name,
      date: q.date,
      content: q.content,
      contentPreview:
        q.content.length > 80 ? `${q.content.slice(0, 80)}…` : q.content,
      hasAiAnswer: Boolean(q.aiAnswer),
      hasTeacherAnswer: Boolean(q.teacherAnswer),
      isResolved: q.isResolved,
      imageUrl: q.imageUrl,
      aiAnswer: q.aiAnswer,
      teacherAnswer: q.teacherAnswer,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
