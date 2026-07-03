import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { buildConsultationNote } from "@/lib/consultation-note";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { logAnalyticsEvent } from "@/lib/analytics";
import { issueMobileTokens } from "@/lib/mobile-auth";
import {
  normalizePhoneDigits,
  studentSyntheticEmailFromDigits,
} from "@/lib/phone-login";
import { prisma } from "@/lib/prisma";
import { createConsultationRequest } from "@/lib/student-enrollment";

type ConsultationPayload = {
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

async function attachConsultationIfProvided(
  studentId: string,
  studentName: string,
  consultation: ConsultationPayload,
): Promise<{ attached: boolean; status?: string }> {
  const grade = typeof consultation.grade === "string" ? consultation.grade.trim() : "";
  const subjects = parseSubjects(consultation.subjects);
  const gradeLevel =
    typeof consultation.gradeLevel === "string" ? consultation.gradeLevel.trim() : "";
  const memo = typeof consultation.memo === "string" ? consultation.memo : "";

  if (!grade || !subjects || !gradeLevel) {
    return { attached: false };
  }

  const note = buildConsultationNote(gradeLevel, memo);
  const updated = await prisma.student.update({
    where: { id: studentId },
    data: { grade, subjects },
    select: { id: true, name: true, grade: true },
  });

  try {
    const booking = await createConsultationRequest({
      studentId: updated.id,
      studentName: updated.name,
      studentGrade: updated.grade,
      note,
    });
    return { attached: true, status: booking.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ALREADY_ACTIVE" || msg === "ALREADY_COMPLETED") {
      return { attached: true, status: msg === "ALREADY_COMPLETED" ? "COMPLETED" : "WAITING" };
    }
    throw e;
  }
}

/** POST /api/mobile/auth/register — 학생 계정 생성 */
export async function POST(request: Request) {
  let body: {
    name?: unknown;
    email?: unknown;
    password?: unknown;
    phone?: unknown;
    guardianConsent?: unknown;
    consultation?: ConsultationPayload;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!name || !password || !phone) {
    return NextResponse.json({ error: "이름, 비밀번호, 전화번호를 입력해 주세요." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
  }

  const digits = normalizePhoneDigits(phone);
  if (digits.length < 10) {
    return NextResponse.json({ error: "올바른 전화번호를 입력해 주세요." }, { status: 400 });
  }

  // 이메일: 입력된 이메일 우선, 없으면 전화번호 기반 합성 이메일
  const email = rawEmail || studentSyntheticEmailFromDigits(digits);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { student: { phone: digits } }] },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 가입된 전화번호 또는 이메일입니다." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const guardianConsentAt = body.guardianConsent === true ? new Date() : undefined;

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: "STUDENT",
      student: {
        create: {
          name,
          phone: digits,
          grade: "",
          subjects: "",
          guardianConsentAt,
        },
      },
    },
    select: { id: true, role: true, student: { select: { id: true, name: true } } },
  });

  let consultationAttached = false;
  if (body.consultation && user.student) {
    const result = await attachConsultationIfProvided(
      user.student.id,
      user.student.name,
      body.consultation,
    );
    consultationAttached = result.attached;
  }

  const tokens = issueMobileTokens(user.id, user.role);

  logAnalyticsEvent({
    name: ANALYTICS_EVENTS.studentRegistered,
    userId: user.id,
    platform: "mobile",
    payload: { consultationAttached },
  });

  return NextResponse.json({ ...tokens, consultationAttached }, { status: 201 });
}
