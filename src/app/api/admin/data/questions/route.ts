import { NextResponse } from "next/server";

import { parsePagination, requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const q = searchParams.get("q")?.trim() ?? "";
  const from = searchParams.get("from")?.trim() ?? "";
  const to = searchParams.get("to")?.trim() ?? "";
  const resolved = searchParams.get("resolved");

  // 학생 루트 메시지(=질문)만 조회한다. 답변은 replies로 include.
  const where: Prisma.QuestionMessageWhereInput = {
    sender: "me",
    replyToId: null,
    AND: [
      q ? { student: { name: { contains: q, mode: "insensitive" as const } } } : {},
      from ? { date: { gte: from } } : {},
      to ? { date: { lte: to } } : {},
      resolved === "true" ? { isResolved: true } : {},
      resolved === "false" ? { isResolved: false } : {},
    ],
  };

  const [total, roots] = await Promise.all([
    prisma.questionMessage.count({ where }),
    prisma.questionMessage.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        date: true,
        body: true,
        imageUrl: true,
        isResolved: true,
        student: { select: { name: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          select: { sender: true, body: true, createdAt: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    questions: roots.map((row) => {
      const aiReply = row.replies.find((r) => r.sender === "ai") ?? null;
      const teacherReply = row.replies.find((r) => r.sender === "tutor") ?? null;
      const content = row.body;
      return {
        id: row.id,
        studentName: row.student.name,
        date: row.date ?? "",
        content,
        contentPreview:
          content.length > 80 ? `${content.slice(0, 80)}…` : content,
        hasAiAnswer: Boolean(aiReply),
        hasTeacherAnswer: Boolean(teacherReply),
        isResolved: row.isResolved,
        imageUrl: row.imageUrl,
        aiAnswer: aiReply?.body ?? null,
        teacherAnswer: teacherReply?.body ?? null,
      };
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
