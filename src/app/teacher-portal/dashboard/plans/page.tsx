import { redirect } from "next/navigation";

import { TeacherPlanClient } from "@/components/teacher-portal/TeacherPlanClient";
import { auth } from "@/auth";
import { isPortalTeacherRole } from "@/lib/portal-roles";
import { getTeacherByUserId } from "@/lib/get-teacher-cache";
import { prisma } from "@/lib/prisma";
import type { StudentListItem } from "@/components/teacher-portal/teacher-students-types";

export const metadata = {
  title: "진도·숙제",
};

export default async function TeacherPlansPage() {
  const session = await auth();
  if (!session?.user?.id || !isPortalTeacherRole(session.user.role)) {
    redirect("/teacher-portal");
  }

  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) {
    redirect("/teacher-portal");
  }

  const matches = await prisma.teacherStudent.findMany({
    where: { teacherId: teacher.id, isActive: true },
    select: {
      subjects: true,
      startDate: true,
      student: { select: { id: true, name: true, grade: true, phone: true } },
    },
    orderBy: { student: { name: "asc" } },
  });

  const initialStudents: StudentListItem[] = matches.map((m) => ({
    id: m.student.id,
    name: m.student.name,
    grade: m.student.grade,
    phone: m.student.phone,
    subjects: m.subjects,
    startDate: m.startDate,
    firstLessonAt: null,
  }));

  return <TeacherPlanClient initialStudents={initialStudents} />;
}
