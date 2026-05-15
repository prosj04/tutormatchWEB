import { redirect } from "next/navigation";

import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { isAiAnswerEnabled } from "@/lib/ai-answer";
import { auth } from "@/auth";
import { formatDateKey } from "@/lib/study-plan-dates";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "학습 플래너",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/teacher-portal/dashboard");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
  });

  if (!student) {
    redirect("/register");
  }

  const now = new Date();
  const initialDate = formatDateKey(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );

  return (
    <StudentDashboard
      studentName={student.name}
      studentId={student.id}
      initialDate={initialDate}
      aiAnswerEnabled={isAiAnswerEnabled()}
    />
  );
}
