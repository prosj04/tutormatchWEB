import { redirect } from "next/navigation";

import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { QuestionsPageClient } from "@/components/questions/QuestionsPageClient";

export const metadata = { title: "내 질문" };

type SearchParams = { resolved?: string };

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/teacher-portal/dashboard");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });
  if (!student) redirect("/?signup=1");

  const resolvedFilter = searchParams?.resolved;
  const where: Prisma.QuestionWhereInput = {
    studentId: student.id,
    ...(resolvedFilter === "true" ? { isResolved: true } : {}),
    ...(resolvedFilter === "false" ? { isResolved: false } : {}),
  };

  const questions = await prisma.question.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      date: true,
      content: true,
      imageUrl: true,
      isResolved: true,
      teacherAnswer: true,
      aiAnswer: true,
      createdAt: true,
    },
  });

  const items = questions.map((q) => ({
    id: q.id,
    date: q.date,
    content: q.content,
    imageUrl: q.imageUrl,
    isResolved: q.isResolved,
    hasTeacherAnswer: !!q.teacherAnswer,
    hasAiAnswer: !!q.aiAnswer,
    createdAt: q.createdAt.toISOString(),
  }));

  return (
    <QuestionsPageClient
      studentName={student.name}
      initialItems={items}
      initialFilter={resolvedFilter ?? "all"}
    />
  );
}
