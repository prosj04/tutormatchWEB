import { NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { answerAsTeacher, getStudentQuestion } from "@/lib/qna";
import { requireTeacherStudentMatch } from "@/lib/teacher-student-match";
import { requireTeacher } from "@/lib/teacher-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id } = await context.params;

  const root = await prisma.questionMessage.findFirst({
    where: { id, sender: "me", replyToId: null },
    select: {
      id: true,
      studentId: true,
      student: { include: { user: true } },
      replies: {
        where: { sender: "tutor" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      },
    },
  });
  if (!root) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const matchResult = await requireTeacherStudentMatch(teacher.id, root.studentId);
  if ("error" in matchResult) return matchResult.error;

  let body: { teacherAnswer?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.teacherAnswer !== "string" || !body.teacherAnswer.trim()) {
    return NextResponse.json({ error: "Answer is required" }, { status: 400 });
  }

  const answerText = body.teacherAnswer.trim();
  const existingTeacherReply = root.replies[0];

  if (existingTeacherReply) {
    // 재편집: 첫 강사 답변의 본문을 갱신한다.
    await prisma.questionMessage.update({
      where: { id: existingTeacherReply.id },
      data: {
        body: answerText,
        teacherId: teacher.id,
      },
    });
  } else {
    await answerAsTeacher({
      rootMessageId: root.id,
      teacherId: teacher.id,
      body: answerText,
    });
  }

  await createNotification({
    userId: root.student.userId,
    type: "TEACHER_ANSWERED",
    title: "선생님이 답변했습니다",
    body: "등록하신 질문에 선생님 답변이 등록되었습니다.",
    relatedId: root.id,
  });

  const updated = await getStudentQuestion(root.id, root.studentId);
  return NextResponse.json({ question: updated });
}
