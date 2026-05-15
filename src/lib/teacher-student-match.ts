import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function getActiveTeacherStudentMatch(
  teacherId: string,
  studentId: string,
) {
  return prisma.teacherStudent.findFirst({
    where: {
      teacherId,
      studentId,
      isActive: true,
    },
  });
}

export async function requireTeacherStudentMatch(
  teacherId: string,
  studentId: string,
) {
  const match = await getActiveTeacherStudentMatch(teacherId, studentId);
  if (!match) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  return { match } as const;
}
