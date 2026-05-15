import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireTeacherStudentMatch } from "@/lib/teacher-student-match";
import { requireTeacher } from "@/lib/teacher-auth";

type RouteContext = { params: Promise<{ planId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { planId } = await context.params;

  const plan = await prisma.studyPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const matchResult = await requireTeacherStudentMatch(teacher.id, plan.studentId);
  if ("error" in matchResult) return matchResult.error;

  let body: { comment?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.comment !== "string") {
    return NextResponse.json({ error: "Comment is required" }, { status: 400 });
  }

  const updated = await prisma.studyPlan.update({
    where: { id: planId },
    data: {
      comment: body.comment.trim() || null,
      commentAt: body.comment.trim() ? new Date() : null,
      commentBy: body.comment.trim() ? teacher.id : null,
    },
    include: { tasks: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ plan: updated });
}
