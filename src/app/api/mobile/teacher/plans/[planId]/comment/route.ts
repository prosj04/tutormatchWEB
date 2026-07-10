import { NextResponse } from "next/server";

import { requireMobileTeacher } from "@/lib/mobile-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireTeacherStudentMatch } from "@/lib/teacher-student-match";

type RouteContext = { params: Promise<{ planId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireMobileTeacher(request);
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { planId } = await context.params;

  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
    include: { student: { include: { user: true } } },
  });
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

  const commentText = body.comment.trim();
  const updated = await prisma.studyPlan.update({
    where: { id: planId },
    data: {
      comment: commentText || null,
      commentAt: commentText ? new Date() : null,
      commentBy: commentText ? teacher.id : null,
    },
    include: { tasks: { orderBy: { order: "asc" } } },
  });

  if (commentText) {
    await createNotification({
      userId: plan.student.userId,
      type: "TEACHER_COMMENT",
      title: "선생님이 코멘트를 남겼습니다",
      body: `${plan.date} 학습 계획에 선생님 코멘트가 등록되었습니다.`,
      relatedId: planId,
    });
  }

  return NextResponse.json({ plan: updated });
}
