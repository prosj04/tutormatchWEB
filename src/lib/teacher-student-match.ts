import { NextResponse } from "next/server";

import { trackJourneyActiveIfFirst } from "@/lib/analytics-journey";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export type AcceptedTeacherStudentMatch = {
  id: string;
  teacherId: string;
  studentId: string;
  subjects: string;
  isActive: true;
  teacher: { id: string; name: string };
};

export type AcceptTeacherStudentMatchResult =
  | { ok: true; alreadyActive: boolean; match: AcceptedTeacherStudentMatch }
  | { ok: false; error: "not_found" };

/**
 * 학생이 배정된 선생님을 수락한다 (모바일/웹 공통 경로).
 * 이미 수락된 매칭이면 중복 알림 없이 현재 상태만 반환한다.
 */
export async function acceptTeacherStudentMatch(
  matchId: string,
  studentId: string,
  studentName: string,
): Promise<AcceptTeacherStudentMatchResult> {
  const existing = await prisma.teacherStudent.findFirst({
    where: { id: matchId, studentId },
    include: { teacher: { select: { id: true, name: true, userId: true } } },
  });

  if (!existing) {
    return { ok: false, error: "not_found" };
  }

  if (existing.isActive) {
    return {
      ok: true,
      alreadyActive: true,
      match: {
        id: existing.id,
        teacherId: existing.teacherId,
        studentId: existing.studentId,
        subjects: existing.subjects,
        isActive: true,
        teacher: { id: existing.teacher.id, name: existing.teacher.name },
      },
    };
  }

  const updated = await prisma.teacherStudent.update({
    where: { id: existing.id },
    data: { isActive: true, matchStatus: "ACTIVE", respondedAt: new Date() },
    include: { teacher: { select: { id: true, name: true, userId: true } } },
  });

  await createNotification({
    userId: updated.teacher.userId,
    type: "NEW_STUDENT_ASSIGNED",
    title: "학생이 배정 선생님을 수락했습니다",
    body: `${studentName} 학생이 배정을 수락했습니다. 첫 수업 날짜를 설정해 주세요.`,
    relatedId: studentId,
  });

  await trackJourneyActiveIfFirst(studentId);

  return {
    ok: true,
    alreadyActive: false,
    match: {
      id: updated.id,
      teacherId: updated.teacherId,
      studentId: updated.studentId,
      subjects: updated.subjects,
      isActive: true,
      teacher: { id: updated.teacher.id, name: updated.teacher.name },
    },
  };
}

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
