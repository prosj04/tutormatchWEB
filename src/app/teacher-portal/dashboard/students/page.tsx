import { redirect } from "next/navigation";

import { TeacherStudentsManager } from "@/components/teacher-portal/TeacherStudentsManager";
import { auth } from "@/auth";
import { isPortalTeacherRole } from "@/lib/portal-roles";
import { prisma } from "@/lib/prisma";
import type { StudentListItem } from "@/components/teacher-portal/teacher-students-types";

export const metadata = {
  title: "학생 관리",
};

export default async function TeacherStudentsPage() {
  const session = await auth();
  if (!session?.user?.id || !isPortalTeacherRole(session.user.role)) {
    redirect("/teacher-portal");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        where: { isActive: true },
        include: { student: true },
        orderBy: { student: { name: "asc" } },
      },
    },
  });

  if (!teacher) {
    redirect("/teacher-portal");
  }

  const initialStudents: StudentListItem[] = teacher.students.map((m) => ({
    id: m.student.id,
    name: m.student.name,
    grade: m.student.grade,
    phone: m.student.phone,
    subjects: m.subjects,
    startDate: m.startDate,
  }));

  return <TeacherStudentsManager initialStudents={initialStudents} />;
}
