import { redirect } from "next/navigation";

import { TeacherPortalShell } from "@/components/teacher-portal/TeacherPortalShell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    redirect("/teacher-portal");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
  });

  if (!teacher) {
    redirect("/teacher-portal");
  }

  return <TeacherPortalShell teacherName={teacher.name}>{children}</TeacherPortalShell>;
}
