import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { getTokenWallet } from "@/lib/mobile-token-wallet";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/mobile/qna — QnA 탭 진입용.
 * 배정된 선생님 목록 + 기본(첫) 선생님과의 대화 + 토큰 잔여를 반환한다.
 * 배정 선생님이 없으면 teacher=null 로 빈 상태를 알린다.
 */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const [matches, wallet] = await Promise.all([
    prisma.teacherStudent.findMany({
      where: { studentId: student.id, isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        subjects: true,
        teacher: { select: { id: true, name: true, subjects: true } },
      },
    }),
    getTokenWallet(student.id),
  ]);

  const teachers = matches.map((m) => ({
    id: m.teacher.id,
    name: m.teacher.name,
    subjects: m.subjects || m.teacher.subjects,
  }));

  if (teachers.length === 0) {
    return NextResponse.json({ teacher: null, teachers: [], messages: [], wallet });
  }

  const primary = teachers[0];
  const messages = await prisma.questionMessage.findMany({
    where: { studentId: student.id, teacherId: primary.id },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      sender: true,
      body: true,
      imageUrl: true,
      tokenCost: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ teacher: primary, teachers, messages, wallet });
}
