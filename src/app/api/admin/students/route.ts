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
      { name: { not: { startsWith: "[sample]" } } },
      unmatchedFor ? { id: { notIn: excludedIds } } : {},
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
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
        user: { select: { createdAt: true } },
        // ConsultationBooking is now a history collection. Take the most-recent
        // row per student (open or latest closed) for manager attribution.
        consultationBookings: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { manager: { select: { name: true } } },
        },
        managerLinks: {
          include: { manager: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        teachers: {
          where: { isActive: true },
          include: { teacher: { select: { name: true } } },
        },
      },
    }),
  ]);

  return NextResponse.json({
    students: students.map((s) => {
      const currentBooking = s.consultationBookings[0];
      const managerName =
        currentBooking?.manager?.name ??
        s.managerLinks[0]?.manager?.name ??
        null;
      return {
        id: s.id,
        name: s.name,
        grade: s.grade,
        subjects: s.subjects,
        phone: s.phone,
        managerName,
        createdAt: s.user.createdAt,
        assignedTeachers: s.teachers.map((t) => t.teacher.name).join(", "),
      };
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
