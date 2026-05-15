import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/student-auth";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedQuestion(id: string, studentId: string) {
  return prisma.question.findFirst({
    where: { id, studentId },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { id } = await context.params;
  const existing = await getOwnedQuestion(id, student.id);
  if (!existing) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  let body: { isResolved?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.isResolved !== "boolean") {
    return NextResponse.json({ error: "Invalid isResolved" }, { status: 400 });
  }

  const question = await prisma.question.update({
    where: { id },
    data: { isResolved: body.isResolved },
  });

  return NextResponse.json({ question });
}
