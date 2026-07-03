import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { assignChiefManagerToStudent, createConsultationRequest } from "@/lib/student-enrollment";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { logAnalyticsEvent } from "@/lib/analytics";
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

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(grade) ||
    !isNonEmptyString(phone) ||
    !isNonEmptyString(password)
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const phoneDigits = normalizePhoneDigits(phone);
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const gender = parseProfileGender(body.gender);
  if (!gender) {
    return NextResponse.json({ error: "Gender required" }, { status: 400 });
  }

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const subjectStrings = subjects.filter(isNonEmptyString);
  if (subjectStrings.length !== subjects.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const subjectsCsv = subjectStrings.join(",");
  const guardianPhone = isNonEmptyString(rawGuardianPhone)
    ? normalizePhoneDigits(rawGuardianPhone)
    : undefined;
  if (guardianPhone && (guardianPhone.length < 10 || guardianPhone.length > 11)) {
    return NextResponse.json({ error: "Invalid guardian phone number" }, { status: 400 });
  }
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
    return NextResponse.json({ error: "Phone already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const instantEnroll = body.instantEnroll === true;
    const guardianConsentAt = guardianConsent === true ? new Date() : undefined;

    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: "STUDENT",
          student: {
            create: {
              name: name.trim(),
              grade,
              subjects: subjectsCsv,
              phone: phoneDigits,
              guardianPhone,
              gender,
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
        if (msg !== "ALREADY_ACTIVE" && msg !== "ALREADY_COMPLETED") {
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
      return NextResponse.json({ error: "Phone already registered" }, { status: 409 });
    }
    throw e;
  }
}
