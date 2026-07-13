import { formatDateKey } from "@/lib/study-plan-dates";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/**
 * 수업 확인 제도 — 선생님이 종료된 수업을 확인 처리하는 공통 로직.
 * 웹(/api/teacher/lessons/[id]/confirm)·모바일 라우트가 함께 사용한다.
 *
 * 배경: 방문 수업이라 시스템이 노쇼를 감지할 수 없다. 자동 완료를 폐지하고
 * 선생님 확인으로 정산 집계(COMPLETED)와 이월(CANCELLED+대체 수업)을 구분한다.
 *
 * outcome:
 *  - COMPLETED: 정상 완료 (정산 포함). 3자에게 정상 완료 공지.
 *  - NOT_HELD + fault=STUDENT: 학생 과실 — 강사가 방문했으므로 COMPLETED + 사유 기록(정산 포함, 회차 소진).
 *  - NOT_HELD + fault=NOT_STUDENT: 비학생 과실 — 원 수업은 미완료(CANCELLED+사유),
 *    마지막 예정 수업 이후 같은 요일·시간대로 대체 수업 1회 자동 생성(이월).
 */

export type LessonConfirmInput =
  | { outcome: "COMPLETED" }
  | { outcome: "NOT_HELD"; fault: "STUDENT" | "NOT_STUDENT"; reason: string };

export type LessonConfirmResult =
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      resolvedStatus: "COMPLETED" | "CANCELLED";
      makeup: { id: string; startAt: Date } | null;
      makeupSkippedReason: string | null;
    };

/** KST 달력 기준 날짜 귀속 (run-alert-checks.lessonDateStr와 동일 규칙) */
function lessonDateStr(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return formatDateKey(
    kst.getUTCFullYear(),
    kst.getUTCMonth() + 1,
    kst.getUTCDate(),
  );
}

/**
 * COMPLETED 전이 시 해당 (studentId, date)의 lesson-sourced StudySession을
 * 완료 수업 합계로 재계산한다(run-alert-checks §4와 동일 규칙, 학습시간 집계 유지).
 */
async function recomputeStudySessionForDate(studentId: string, date: string) {
  const dayStart = new Date(date + "T00:00:00.000Z");
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  // KST 날짜에 귀속되는 UTC 범위: date 00:00 KST = 전날 15:00 UTC
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const rangeStart = new Date(dayStart.getTime() - kstOffsetMs);
  const rangeEnd = new Date(dayEnd.getTime() - kstOffsetMs);

  const completed = await prisma.lesson.findMany({
    where: {
      studentId,
      status: "COMPLETED",
      startAt: { gte: rangeStart, lt: rangeEnd },
    },
    select: { startAt: true, durationMin: true },
  });

  const minutes = completed
    .filter((l) => lessonDateStr(l.startAt) === date)
    .reduce((sum, l) => sum + l.durationMin, 0);

  await prisma.$transaction(async (tx) => {
    await tx.studySession.deleteMany({
      where: { studentId, date, source: "lesson" },
    });
    if (minutes > 0) {
      await tx.studySession.create({
        data: { studentId, date, minutes, source: "lesson" },
      });
    }
  });
}

type ConfirmTargetLesson = {
  id: string;
  studentId: string;
  teacherId: string;
  subject: string;
  startAt: Date;
  durationMin: number;
  status: string;
  student: { userId: string; name: string };
  teacher: { name: string };
};

function formatDate(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function formatDateTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} ${hh}:${min}`;
}

/**
 * 3자(학생·학부모·선생님)에게 결과를 공지한다.
 * 학부모 전달은 notifications.PARENT_FANOUT_TYPES 화이트리스트가 담당(학생 알림 생성 시 자동 팬아웃).
 */
async function notifyThreeParties(
  lesson: ConfirmTargetLesson,
  type: "LESSON_COMPLETED_CONFIRMED" | "LESSON_NOT_HELD",
  studentBody: string,
  teacherBody: string,
  teacherUserId: string,
) {
  const title =
    type === "LESSON_COMPLETED_CONFIRMED" ? "수업 완료" : "수업 미완료 안내";
  // 학생(→ 화이트리스트에 의해 학부모로 팬아웃) + 선생님
  await createNotification({
    userId: lesson.student.userId,
    type,
    title,
    body: studentBody,
    relatedId: lesson.id,
  });
  await createNotification({
    userId: teacherUserId,
    type,
    title,
    body: teacherBody,
    relatedId: lesson.id,
  });
}

/**
 * 대체 수업 시각 계산(순수) — 기준점(anchor) + 7일, 원 수업의 시·분을 유지.
 * 이미 지난 시각이면 null (자동 생성 불가 → 직접 예약 안내).
 */
export function computeMakeupAt(
  anchor: Date,
  originalStartAt: Date,
  now: Date = new Date(),
): Date | null {
  const makeupAt = new Date(anchor.getTime() + 7 * 24 * 60 * 60 * 1000);
  makeupAt.setHours(
    originalStartAt.getHours(),
    originalStartAt.getMinutes(),
    0,
    0,
  );
  return makeupAt > now ? makeupAt : null;
}

/**
 * 비학생 과실 이월 — 해당 (teacher, student) 매칭의 마지막 예정(SCHEDULED) 수업
 * 이후 같은 요일·시간대로 대체 수업 1회를 생성한다. cancel 라우트 보강 로직 재사용.
 */
async function createCarryoverLesson(
  lesson: ConfirmTargetLesson,
): Promise<{ makeup: { id: string; startAt: Date } | null; skipped: string | null }> {
  // 마지막 예정 수업(원 수업 제외) 기준점. 없으면 원 수업 시각 기준.
  const lastScheduled = await prisma.lesson.findFirst({
    where: {
      studentId: lesson.studentId,
      teacherId: lesson.teacherId,
      status: "SCHEDULED",
      id: { not: lesson.id },
    },
    orderBy: { startAt: "desc" },
    select: { startAt: true },
  });

  const anchor = lastScheduled?.startAt ?? lesson.startAt;
  // 같은 요일·시간대 = 기준점 + 7일(원 수업의 시·분을 유지)
  const makeupAt = computeMakeupAt(anchor, lesson.startAt);

  if (!makeupAt) {
    return {
      makeup: null,
      skipped:
        "대체 수업 예정 시각이 이미 지나 자동 생성되지 않았습니다. 다른 시간으로 직접 예약해 주세요.",
    };
  }

  const existing = await prisma.lesson.findFirst({
    where: {
      studentId: lesson.studentId,
      teacherId: lesson.teacherId,
      startAt: makeupAt,
      status: { not: "CANCELLED" },
    },
    select: { id: true },
  });
  if (existing) {
    return {
      makeup: null,
      skipped:
        "해당 시간에 이미 수업이 있어 대체 수업이 생성되지 않았습니다. 다른 시간으로 직접 예약해 주세요.",
    };
  }

  const makeup = await prisma.lesson.create({
    data: {
      studentId: lesson.studentId,
      teacherId: lesson.teacherId,
      subject: lesson.subject,
      startAt: makeupAt,
      durationMin: lesson.durationMin,
    },
    select: { id: true, startAt: true },
  });
  return { makeup, skipped: null };
}

/**
 * 확인 처리 본체. 호출부(웹/모바일)에서 본인 수업 검증(teacherId 일치)을 마친 뒤 호출한다.
 * teacherUserId는 3자 공지용(선생님 본인 알림).
 */
export async function confirmLesson(
  lessonId: string,
  teacherId: string,
  teacherUserId: string,
  input: LessonConfirmInput,
): Promise<LessonConfirmResult> {
  const lesson = (await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      studentId: true,
      teacherId: true,
      subject: true,
      startAt: true,
      durationMin: true,
      status: true,
      student: { select: { userId: true, name: true } },
      teacher: { select: { name: true } },
    },
  })) as ConfirmTargetLesson | null;

  if (!lesson) {
    return { ok: false, status: 404, error: "Lesson not found" };
  }
  if (lesson.teacherId !== teacherId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  if (lesson.status !== "SCHEDULED") {
    return {
      ok: false,
      status: 409,
      error: "이미 확인 처리되었거나 취소된 수업입니다",
    };
  }

  const dateStr = formatDate(lesson.startAt);

  // ── 정상 완료 또는 학생 과실 완료 → COMPLETED (정산 포함) ──────────────────
  if (
    input.outcome === "COMPLETED" ||
    (input.outcome === "NOT_HELD" && input.fault === "STUDENT")
  ) {
    const isStudentFault = input.outcome === "NOT_HELD";
    const reason =
      isStudentFault && "reason" in input
        ? input.reason.trim().slice(0, 500)
        : null;

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        status: "COMPLETED",
        confirmedAt: new Date(),
        ...(isStudentFault
          ? { notHeldFault: "STUDENT", notHeldReason: reason }
          : {}),
      },
    });

    // 학습시간 집계 유지 — COMPLETED 전이 시 StudySession 재계산.
    await recomputeStudySessionForDate(lesson.studentId, lessonDateStr(lesson.startAt));

    if (isStudentFault) {
      const studentBody = `${dateStr} 수업이 완료 처리되었습니다.${reason ? ` (사유: ${reason})` : ""}`;
      const teacherBody = `${lesson.student.name} 학생의 ${dateStr} 수업을 완료 처리했습니다.${reason ? ` (사유: ${reason})` : ""}`;
      await notifyThreeParties(
        lesson,
        "LESSON_COMPLETED_CONFIRMED",
        studentBody,
        teacherBody,
        teacherUserId,
      );
    } else {
      const studentBody = `${dateStr} 수업이 완료되었습니다.`;
      const teacherBody = `${lesson.student.name} 학생의 ${dateStr} 수업을 완료 처리했습니다.`;
      await notifyThreeParties(
        lesson,
        "LESSON_COMPLETED_CONFIRMED",
        studentBody,
        teacherBody,
        teacherUserId,
      );
    }

    return {
      ok: true,
      resolvedStatus: "COMPLETED",
      makeup: null,
      makeupSkippedReason: null,
    };
  }

  // ── 비학생 과실 → 이월 (원 수업 CANCELLED + 대체 수업 생성) ──────────────────
  const reason =
    "reason" in input ? input.reason.trim().slice(0, 500) : "";

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      status: "CANCELLED",
      cancelledBy: "TEACHER",
      confirmedAt: new Date(),
      notHeldFault: "NOT_STUDENT",
      notHeldReason: reason || null,
      ...(reason ? { cancelReason: reason } : {}),
    },
  });

  const { makeup, skipped } = await createCarryoverLesson(lesson);

  const makeupStr = makeup ? formatDateTime(makeup.startAt) : null;
  const studentBody = makeupStr
    ? `${dateStr} 수업이 진행되지 못했습니다.${reason ? ` (사유: ${reason})` : ""} 대체 수업이 ${makeupStr}에 예정되었습니다.`
    : `${dateStr} 수업이 진행되지 못했습니다.${reason ? ` (사유: ${reason})` : ""}`;
  const teacherBody = makeupStr
    ? `${lesson.student.name} 학생의 ${dateStr} 수업을 미완료로 처리했습니다. 대체 수업: ${makeupStr}`
    : `${lesson.student.name} 학생의 ${dateStr} 수업을 미완료로 처리했습니다.`;

  await notifyThreeParties(
    lesson,
    "LESSON_NOT_HELD",
    studentBody,
    teacherBody,
    teacherUserId,
  );

  return {
    ok: true,
    resolvedStatus: "CANCELLED",
    makeup,
    makeupSkippedReason: skipped,
  };
}

/**
 * D+7 무응답 자동 이월 — 확인 요청 후 7일간 선생님 응답이 없으면 비과실(NOT_STUDENT)로
 * 간주해 이월한다(오너 확정: 무응답 자동 완료 폐지). confirmLesson의 비학생 과실 경로와
 * 동일한 메커니즘(CANCELLED + 대체 수업 자동 생성 + 3자 공지)을 재사용한다.
 * CANCELLED이므로 정산(COMPLETED 집계)·StudySession(source="lesson") 대상이 아니다.
 *
 * 멱등: 수업이 없거나 SCHEDULED가 아니면 아무것도 하지 않고 null을 반환한다.
 */
export async function autoCarryOverUnconfirmedLesson(lessonId: string): Promise<{
  makeup: { id: string; startAt: Date } | null;
  makeupSkippedReason: string | null;
} | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      studentId: true,
      teacherId: true,
      subject: true,
      startAt: true,
      durationMin: true,
      status: true,
      student: { select: { userId: true, name: true } },
      teacher: { select: { userId: true, name: true } },
    },
  });
  if (!lesson || lesson.status !== "SCHEDULED") return null;

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      status: "CANCELLED",
      cancelledBy: "SYSTEM",
      confirmedAt: new Date(),
      notHeldFault: "NOT_STUDENT",
      notHeldReason: "선생님 확인 무응답 이월",
    },
  });

  const { makeup, skipped } = await createCarryoverLesson(lesson);

  const dateStr = formatDate(lesson.startAt);
  const makeupStr = makeup ? formatDateTime(makeup.startAt) : null;
  const studentBody = makeupStr
    ? `${dateStr} 수업이 확인되지 않아 이월되었습니다. 대체 수업이 ${makeupStr}에 예정되었습니다.`
    : `${dateStr} 수업이 확인되지 않아 이월되었습니다. 대체 수업 일정은 선생님과 조율해 주세요.`;
  const teacherBody = makeupStr
    ? `${lesson.student.name} 학생의 ${dateStr} 수업이 확인되지 않아 이월 처리되었습니다. 대체 수업: ${makeupStr}`
    : `${lesson.student.name} 학생의 ${dateStr} 수업이 확인되지 않아 이월 처리되었습니다. 대체 수업을 직접 예약해 주세요.`;

  await notifyThreeParties(
    lesson,
    "LESSON_NOT_HELD",
    studentBody,
    teacherBody,
    lesson.teacher.userId,
  );

  return { makeup, makeupSkippedReason: skipped };
}

export type PendingConfirmLesson = {
  id: string;
  startAt: string;
  subject: string;
  durationMin: number;
  studentId: string;
  studentName: string;
};

/**
 * 확인 대기 수업 목록 — 종료(예정 종료 시각 경과)된 SCHEDULED 수업.
 * 웹 포털 카드·모바일 홈 카드가 함께 사용한다.
 */
export async function getPendingConfirmLessons(
  teacherId: string,
): Promise<PendingConfirmLesson[]> {
  const now = Date.now();
  const candidates = await prisma.lesson.findMany({
    where: { teacherId, status: "SCHEDULED" },
    select: {
      id: true,
      startAt: true,
      subject: true,
      durationMin: true,
      student: { select: { id: true, name: true } },
    },
    orderBy: { startAt: "asc" },
    take: 100,
  });

  return candidates
    .filter((l) => l.startAt.getTime() + l.durationMin * 60_000 < now)
    .map((l) => ({
      id: l.id,
      startAt: l.startAt.toISOString(),
      subject: l.subject,
      durationMin: l.durationMin,
      studentId: l.student.id,
      studentName: l.student.name,
    }));
}

/** 요청 body 파싱·검증. 유효하지 않으면 error 문자열 반환. */
export function parseConfirmInput(raw: unknown):
  | { ok: true; input: LessonConfirmInput }
  | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "잘못된 요청입니다" };
  }
  const body = raw as Record<string, unknown>;
  if (body.outcome === "COMPLETED") {
    return { ok: true, input: { outcome: "COMPLETED" } };
  }
  if (body.outcome === "NOT_HELD") {
    const fault = body.fault;
    if (fault !== "STUDENT" && fault !== "NOT_STUDENT") {
      return { ok: false, error: "fault 값이 올바르지 않습니다" };
    }
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason) {
      return { ok: false, error: "사유를 입력해 주세요" };
    }
    return { ok: true, input: { outcome: "NOT_HELD", fault, reason } };
  }
  return { ok: false, error: "outcome 값이 올바르지 않습니다" };
}
