import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAiAnswerEnabled } from "@/lib/ai-answer";
import { prisma } from "@/lib/prisma";
import { listStudentTimeline } from "@/lib/qna";
import { QuestionsPageClient } from "@/components/questions/QuestionsPageClient";

export const metadata = { title: "내 질문" };

export default async function QuestionsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/teacher-portal/dashboard");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });
  if (!student) redirect("/?signup=1");

  const messages = await listStudentTimeline(student.id, { take: 200 });

  return (
    <QuestionsPageClient
      studentId={student.id}
      studentName={student.name}
      initialMessages={messages}
      aiAnswerEnabled={isAiAnswerEnabled()}
    />
  );
}
