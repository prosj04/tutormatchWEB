import { redirect } from "next/navigation";

import { TeacherStudentsManager } from "@/components/teacher-portal/TeacherStudentsManager";
import { auth } from "@/auth";
import { isPortalTeacherRole } from "@/lib/portal-roles";
import { getTeacherByUserId } from "@/lib/get-teacher-cache";
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

  // getTeacherByUserId is React-cached: no extra DB round-trip when layout.tsx
  // already called it with the same userId in this request.
  const teacher = await getTeacherByUserId(session.user.id);

  if (!teacher) {
    redirect("/teacher-portal");
  }

  // Students are page-specific; fetch separately using the cached teacher.id.
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
  }));

  return <TeacherStudentsManager initialStudents={initialStudents} />;
}
