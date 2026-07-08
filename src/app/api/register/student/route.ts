import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { assignChiefManagerToStudent, createConsultationRequest } from "@/lib/student-enrollment";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { logAnalyticsEvent } from "@/lib/analytics";
import { STUDENT_GRADES } from "@/lib/consultation-grades";
import { prisma } from "@/lib/prisma";
import {
  normalizePhoneDigits,
  studentSyntheticEmailFromDigits,
} from "@/lib/phone-login";
import { parseProfileGender } from "@/lib/profile-gender";

type StudentBody = {
  name?: unknown;
  grade?: unknown;
  subjects?: unknown;
  phone?: unknown;
  gender?: unknown;
  password?: unknown;
  guardianPhone?: unknown;
  region?: unknown;
  /** true: 상담 대기 없이 대표 매니저 즉시 배정 */
  instantEnroll?: unknown;
  /** true: 보호자(법정대리인)가 개인정보 수집·이용에 동의 */
  guardianConsent?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: Request) {
  let body: StudentBody;
  try {
    body = (await request.json()) as StudentBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, grade, subjects, phone, password, guardianPhone: rawGuardianPhone, guardianConsent } = body;

  if (!isNonEmptyString(name)) {
    return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
  }
  const trimmedName = name.trim();
  if (trimmedName.length > 30) {
    return NextResponse.json({ error: "이름은 30자 이내여야 합니다" }, { status: 400 });
  }
  if (!isNonEmptyString(phone)) {
    return NextResponse.json({ error: "전화번호를 입력해 주세요." }, { status: 400 });
  }
  if (!isNonEmptyString(password) || password.length < 8) {
    return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
  }

  const phoneDigits = normalizePhoneDigits(phone);
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    return NextResponse.json({ error: "올바른 휴대전화 번호를 입력해 주세요." }, { status: 400 });
  }

  // 학년·성별·과목·지역은 가입 후 "추가 정보" 단계에서 선택 입력
  const gender = parseProfileGender(body.gender) ?? undefined;
  const subjectStrings = Array.isArray(subjects) ? subjects.filter(isNonEmptyString) : [];
  const subjectsCsv = subjectStrings.join(",");
  const gradeValue = isNonEmptyString(grade) ? grade.trim() : "";
  if (gradeValue && !STUDENT_GRADES.includes(gradeValue as (typeof STUDENT_GRADES)[number])) {
    return NextResponse.json({ error: "올바른 학년을 선택해 주세요." }, { status: 400 });
  }
  const guardianPhone = isNonEmptyString(rawGuardianPhone)
    ? normalizePhoneDigits(rawGuardianPhone)
    : undefined;
  if (guardianPhone && (guardianPhone.length < 10 || guardianPhone.length > 11)) {
    return NextResponse.json({ error: "올바른 보호자 휴대전화 번호를 입력해 주세요." }, { status: 400 });
  }
  // 학생 회원은 미성년자 전제 — 법정대리인(보호자) 동의 없이는 가입 불가 (BR-8).
  // 클라이언트 체크박스만으로는 우회 가능하므로 서버에서 강제한다.
  if (guardianConsent !== true) {
    return NextResponse.json(
      { error: "보호자(법정대리인) 동의가 필요합니다." },
      { status: 400 },
    );
  }

  const region = isNonEmptyString(body.region) ? body.region.trim().slice(0, 30) : undefined;
  const email = studentSyntheticEmailFromDigits(phoneDigits);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { student: { phone: phoneDigits } },
        { student: { phone: phone.trim() } },
      ],
    },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 가입된 전화번호입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const instantEnroll = body.instantEnroll === true;
    const guardianConsentAt = new Date();

    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: "STUDENT",
          student: {
            create: {
              name: trimmedName,
              grade: gradeValue,
              subjects: subjectsCsv,
              phone: phoneDigits,
              guardianPhone,
              gender,
              region,
              guardianConsentAt,
            },
          },
        },
        include: { student: true },
      });
    });

    if (instantEnroll && user.student) {
      try {
        await assignChiefManagerToStudent({
          studentId: user.student.id,
          studentName: user.student.name,
          studentGrade: user.student.grade,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "NO_DEFAULT_MANAGER") {
          return NextResponse.json(
            { error: "대표 매니저가 설정되지 않았습니다. 관리자에게 문의해 주세요." },
            { status: 503 },
          );
        }
        throw e;
      }
    } else if (user.student) {
      try {
        await createConsultationRequest({
          studentId: user.student.id,
          studentName: user.student.name,
          studentGrade: user.student.grade,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (
          msg !== "ALREADY_ACTIVE" &&
          msg !== "ALREADY_COMPLETED" &&
          msg !== "ALREADY_MATCHING"
        ) {
          throw e;
        }
      }
    }

    logAnalyticsEvent({
      name: ANALYTICS_EVENTS.studentRegistered,
      userId: user.id,
      platform: "web",
      payload: { instantEnroll: !!instantEnroll },
    });

    return NextResponse.json(
      { id: user.id, instantEnroll },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "이미 가입된 전화번호입니다." }, { status: 409 });
    }
    throw e;
  }
}
