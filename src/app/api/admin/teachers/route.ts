import { NextResponse } from "next/server";

import { parsePagination, requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status") ?? "all";

  const where = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {},
      status === "approved" ? { approved: true } : {},
      status === "pending" ? { approved: false } : {},
    ],
  };

  const [total, teachers] = await Promise.all([
    prisma.teacher.count({ where }),
    prisma.teacher.findMany({
      where,
      skip,
      take: limit,
      orderBy: { user: { createdAt: "desc" } },
      include: {
        user: { select: { email: true, createdAt: true } },
        _count: { select: { students: { where: { isActive: true } } } },
      },
    }),
  ]);

  return NextResponse.json({
    teachers: teachers.map((t) => ({
      id: t.id,
      name: t.name,
      subjects: t.subjects,
      phone: t.phone,
      email: t.user.email,
      approved: t.approved,
      bio: t.bio,
      education: t.education,
      experience: t.experience,
      studentCount: t._count.students,
      createdAt: t.user.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
