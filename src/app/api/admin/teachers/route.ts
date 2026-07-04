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
      { name: { not: { startsWith: "[sample]" } } },
      // 탈퇴(소프트 삭제)한 강사는 익명화된 채 approved:false 로 남으므로
      // 관리자 목록(특히 pending 필터)에 유령으로 노출되지 않도록 제외.
      { user: { deletedAt: null } },
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
        user: { select: { email: true, createdAt: true, role: true } },
        profile: { select: { photoUrl: true } },
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
      role: t.user.role,
      approved: t.approved,
      bio: t.bio,
      education: t.education,
      experience: t.experience,
      photoUrl: t.profile?.photoUrl ?? null,
      gender: t.gender ?? null,
      studentCount: t._count.students,
      createdAt: t.user.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
