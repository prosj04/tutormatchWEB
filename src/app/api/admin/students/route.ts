import { NextResponse } from "next/server";

import { parsePagination, requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const q = searchParams.get("q")?.trim() ?? "";
  const grade = searchParams.get("grade")?.trim() ?? "";
  const subject = searchParams.get("subject")?.trim() ?? "";
  const unmatchedFor = searchParams.get("unmatchedFor")?.trim() ?? "";

  const excludedIds = unmatchedFor
    ? (
        await prisma.teacherStudent.findMany({
          where: { teacherId: unmatchedFor, isActive: true },
          select: { studentId: true },
        })
      ).map((m) => m.studentId)
    : [];

  const where = {
    AND: [
      unmatchedFor ? { id: { notIn: excludedIds } } : {},
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {},
      grade ? { grade } : {},
      subject ? { subjects: { contains: subject, mode: "insensitive" as const } } : {},
    ],
  };

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { user: { createdAt: "desc" } },
      include: {
        user: { select: { email: true, createdAt: true } },
        teachers: {
          where: { isActive: true },
          include: { teacher: { select: { name: true } } },
        },
      },
    }),
  ]);

  return NextResponse.json({
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      subjects: s.subjects,
      phone: s.phone,
      email: s.user.email,
      createdAt: s.user.createdAt,
      assignedTeachers: s.teachers.map((t) => t.teacher.name).join(", "),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
