import { NextResponse } from "next/server";

import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

/** GET /api/mobile/tutors?subject=&q= — 승인 강사 목록 (검색·과목 필터) */
export async function GET(request: Request) {
  // 로그인 없이도 둘러볼 수 있게: 토큰 있으면 검증, 없어도 공개 목록 허용
  await getMobileUser(request);

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject")?.trim();
  const q = searchParams.get("q")?.trim();

  const teachers = await prisma.teacher.findMany({
    where: {
      approved: true,
      // 공개 강사진과 동일 규칙: 수업 담당 TEACHER만, 데모용 [sample] 계정 제외
      user: { role: "TEACHER" },
      NOT: { name: { startsWith: "[sample]" } },
      ...(subject ? { subjects: { contains: subject } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { subjects: { contains: q, mode: "insensitive" } },
              { education: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      subjects: true,
      education: true,
      experience: true,
      bio: true,
      gender: true,
      profile: { select: { photoUrl: true, intro: true } },
      reviews: { select: { rating: true } },
      // CANCELLED/수락대기 매칭까지 세면 매칭 수가 부풀려지므로 활성만 카운트.
      _count: { select: { students: { where: { isActive: true } } } },
    },
  });

  const tutors = teachers.map((t) => {
    const ratings = t.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
          10
        : null;
    return {
      id: t.id,
      name: t.name,
      subjects: t.subjects,
      education: t.education,
      experience: t.experience,
      oneLiner: t.bio,
      photoUrl: t.profile?.photoUrl ?? null,
      gender: t.gender,
      verified: true,
      avgRating,
      reviewCount: ratings.length,
      matchCount: t._count.students,
    };
  });

  return NextResponse.json({ tutors });
}
