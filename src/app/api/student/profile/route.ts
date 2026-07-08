import { NextResponse } from "next/server";

import { STUDENT_GRADES, STUDENT_SUBJECTS } from "@/lib/consultation-grades";
import { requireStudent } from "@/lib/student-auth";
import { parseProfileGender } from "@/lib/profile-gender";
import { prisma } from "@/lib/prisma";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** PATCH /api/student/profile — 가입 후 추가 정보(선택) 저장 */
export async function PATCH(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let body: {
    grade?: unknown;
    gender?: unknown;
    region?: unknown;
    subjects?: unknown;
    guardianPhone?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: {
    grade?: string;
    gender?: string;
    region?: string;
    subjects?: string;
    guardianPhone?: string;
  } = {};
  if (isNonEmptyString(body.guardianPhone)) {
    const digits = body.guardianPhone.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 11) {
      // register 경로(normalizePhoneDigits)와 동일하게 숫자만 저장
      data.guardianPhone = digits;
    }
  }
  if (
    isNonEmptyString(body.grade) &&
    (STUDENT_GRADES as readonly string[]).includes(body.grade.trim())
  ) {
    data.grade = body.grade.trim();
  }
  const gender = parseProfileGender(body.gender);
  if (gender) data.gender = gender;
  if (isNonEmptyString(body.region)) data.region = body.region.trim().slice(0, 40);
  if (Array.isArray(body.subjects)) {
    const subjects = body.subjects.filter(
      (s): s is string =>
        isNonEmptyString(s) && (STUDENT_SUBJECTS as readonly string[]).includes(s),
    );
    if (subjects.length > 0) data.subjects = subjects.join(",");
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await prisma.student.update({ where: { id: student.id }, data });
  return NextResponse.json({ ok: true });
}
