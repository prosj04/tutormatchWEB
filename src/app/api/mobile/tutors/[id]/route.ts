import { NextResponse } from "next/server";

import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

/** GET /api/mobile/tutors/[id] — 강사 상세 + 통계 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  getMobileUser(request);

  const t = await prisma.teacher.findFirst({
    where: { id: params.id, approved: true },
    select: {
      id: true,
      name: true,
      subjects: true,
      education: true,
      experience: true,
      bio: true,
      gender: true,
      profile: {
        select: {
          photoUrl: true,
          intro: true,
          career: true,
          education: true,
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          rating: true,
          comment: true,
          createdAt: true,
          student: { select: { name: true } },
        },
      },
      _count: { select: { students: true } },
    },
  });

  if (!t) {
    return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
  }

  const ratings = t.reviews.map((r) => r.rating);
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
        10
      : null;

  return NextResponse.json({
    tutor: {
      id: t.id,
      name: t.name,
      subjects: t.subjects,
      education: t.education,
      experience: t.experience,
      oneLiner: t.bio,
      intro: t.profile?.intro ?? t.bio,
      photoUrl: t.profile?.photoUrl ?? null,
      gender: t.gender,
      verified: true,
      avgRating,
      reviewCount: ratings.length,
      matchCount: t._count.students,
      reviews: t.reviews.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        author: r.student?.name ?? "학생",
        createdAt: r.createdAt,
      })),
    },
  });
}
