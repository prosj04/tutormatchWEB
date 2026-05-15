import { redirect } from "next/navigation";

import { TeacherPortalShell } from "@/components/teacher-portal/TeacherPortalShell";
import { auth } from "@/auth";
import { isPortalTeacherRole } from "@/lib/portal-roles";
import type { PortalTeacherRole } from "@/lib/portal-roles";
import { prisma } from "@/lib/prisma";

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || !isPortalTeacherRole(session.user.role)) {
    redirect("/teacher-portal");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
  });

  if (!teacher) {
    redirect("/teacher-portal");
  }

  return (
    <TeacherPortalShell
      teacherName={teacher.name}
      role={session.user.role as PortalTeacherRole}
    >
      {children}
    </TeacherPortalShell>
  );
}
