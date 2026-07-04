import { NextResponse } from "next/server";

import { buildConsultationNote } from "@/lib/consultation-note";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { logAnalyticsEvent } from "@/lib/analytics";
import { requireMobileStudent } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { createConsultationRequest } from "@/lib/student-enrollment";

type ConsultationBody = {
  grade?: unknown;
  subjects?: unknown;
  gradeLevel?: unknown;
  memo?: unknown;
};

function parseSubjects(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const items = value.filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0,
    );
    if (items.length > 0) return items.join(", ");
  }
  return null;
}

/** POST /api/mobile/consultation — 로그인 학생 상담 신청 */
export async function POST(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student, userId } = authResult;

  let body: ConsultationBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const grade = typeof body.grade === "string" ? body.grade.trim() : "";
  const subjects = parseSubjects(body.subjects);
  const gradeLevel =
    typeof body.gradeLevel === "string" ? body.gradeLevel.trim() : "";
  const memo = typeof body.memo === "string" ? body.memo : "";

  if (!grade || !subjects || !gradeLevel) {
    return NextResponse.json(
      { error: "학년, 과목, 성취도를 입력해 주세요." },
      { status: 400 },
    );
  }

  const note = buildConsultationNote(gradeLevel, memo);

  const updatedStudent = await prisma.student.update({
    where: { id: student.id },
    data: { grade, subjects },
    select: { id: true, name: true, grade: true },
  });

  try {
    const booking = await createConsultationRequest({
      studentId: updatedStudent.id,
      studentName: updatedStudent.name,
      studentGrade: updatedStudent.grade,
      note,
    });

    logAnalyticsEvent({
      name: ANALYTICS_EVENTS.consultationSubmitted,
      userId,
      platform: "mobile",
    });

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          status: booking.status,
          createdAt: booking.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ALREADY_ACTIVE") {
      return NextResponse.json(
        { error: "이미 진행 중인 상담 신청이 있습니다." },
        { status: 409 },
      );
    }
    if (msg === "ALREADY_COMPLETED" || msg === "ALREADY_MATCHING") {
      return NextResponse.json(
        { error: "이미 상담이 완료되어 매칭을 진행 중입니다." },
        { status: 409 },
      );
    }
    throw e;
  }
}
