import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";

export async function GET() {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const matches = await prisma.teacherStudent.findMany({
    where: { teacherId: teacher.id, isActive: true },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          grade: true,
          phone: true,
        },
      },
    },
    orderBy: { student: { name: "asc" } },
  });

  const students = matches.map((m) => ({
    id: m.student.id,
    name: m.student.name,
    grade: m.student.grade,
    phone: m.student.phone,
    subjects: m.subjects,
    startDate: m.startDate,
  }));

  return NextResponse.json({ students });
}
