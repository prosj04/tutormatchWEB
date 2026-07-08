import { NextResponse } from "next/server";

import { autoApplyFirstLessonHomeworkTemplate } from "@/lib/homework-distribution";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getV2PlanById } from "@/lib/pricing-plans";
import { requireTeacherStudentMatch } from "@/lib/teacher-student-match";
import { requireTeacher } from "@/lib/teacher-auth";

type RouteContext = { params: Promise<{ id: string }> };

type RequestBody = {
  date?: unknown;
  time?: unknown;
  durationMin?: unknown;
  joinUrl?: unknown;
};

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10);
}

function isValidTimeString(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function parseLocalDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function todayKstDateString() {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function firstSubject(subjects: string) {
  return subjects.split(/[,\s]+/).filter(Boolean)[0] ?? subjects;
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id: studentId } = await context.params;
  const matchResult = await requireTeacherStudentMatch(teacher.id, studentId);
  if ("error" in matchResult) return matchResult.error;
  const { match } = matchResult;

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const date = typeof body.date === "string" ? body.date.trim() : "";
  const time = typeof body.time === "string" ? body.time.trim() : "";
  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (date < todayKstDateString()) {
    return NextResponse.json({ error: "첫 수업 날짜는 오늘 이후여야 합니다" }, { status: 400 });
  }
  if (!isValidTimeString(time)) {
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  }

  // v2 구독 플랜(hoursPerLesson)에 맞춰 기본 durationMin 산출. body에 명시가 없을 때만 적용.
  let defaultDurationMin = 50;
  const activeSubscription = await prisma.subscription.findFirst({
    where: { studentId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { plan: true },
  });
  const v2Plan = getV2PlanById(activeSubscription?.plan);
  if (v2Plan) {
    defaultDurationMin = v2Plan.hoursPerLesson * 60;
  }

  const durationMin =
    typeof body.durationMin === "number" &&
    Number.isInteger(body.durationMin) &&
    body.durationMin > 0 &&
    body.durationMin <= 300
      ? body.durationMin
      : defaultDurationMin;
  const joinUrl =
    typeof body.joinUrl === "string" && body.joinUrl.trim()
      ? body.joinUrl.trim()
      : null;
  const startAt = parseLocalDateTime(date, time);

  const existingLesson = await prisma.lesson.findFirst({
    where: {
      studentId,
      teacherId: teacher.id,
      status: { not: "CANCELLED" },
    },
    orderBy: { startAt: "asc" },
  });

  if (existingLesson && (existingLesson.startAt < new Date() || existingLesson.status === "COMPLETED")) {
    return NextResponse.json({ error: "이미 진행된 수업은 수정할 수 없습니다" }, { status: 409 });
  }

  const [lesson, student] = await prisma.$transaction([
    existingLesson
      ? prisma.lesson.update({
          where: { id: existingLesson.id },
          data: {
            subject: firstSubject(match.subjects),
            startAt,
            durationMin,
            joinUrl,
          },
        })
      : prisma.lesson.create({
          data: {
            studentId,
            teacherId: teacher.id,
            subject: firstSubject(match.subjects),
            startAt,
            durationMin,
            joinUrl,
          },
        }),
    prisma.teacherStudent.update({
      where: { id: match.id },
      data: { startDate: date },
      select: {
        student: { select: { name: true, userId: true } },
      },
    }),
  ]);

  await createNotification({
    userId: student.student.userId,
    type: "FIRST_LESSON_SET",
    title: "첫 수업 일정이 정해졌습니다",
    body: `${teacher.name} 선생님과의 첫 수업이 ${date} ${time}에 시작됩니다.`,
    relatedId: lesson.id,
  });

  await autoApplyFirstLessonHomeworkTemplate({
    teacherId: teacher.id,
    studentId,
    lessonId: lesson.id,
    startDate: date,
  });

  return NextResponse.json({ lesson, startDate: date });
}

export async function POST(request: Request, context: RouteContext) {
  return PATCH(request, context);
}
