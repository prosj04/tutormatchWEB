import { NextResponse } from "next/server";

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

  let body: { grade?: unknown; gender?: unknown; region?: unknown; subjects?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: { grade?: string; gender?: string; region?: string; subjects?: string } = {};
  if (isNonEmptyString(body.grade)) data.grade = body.grade.trim().slice(0, 20);
  const gender = parseProfileGender(body.gender);
  if (gender) data.gender = gender;
  if (isNonEmptyString(body.region)) data.region = body.region.trim().slice(0, 40);
  if (Array.isArray(body.subjects)) {
    const subjects = body.subjects.filter(isNonEmptyString);
    if (subjects.length > 0) data.subjects = subjects.join(",");
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await prisma.student.update({ where: { id: student.id }, data });
  return NextResponse.json({ ok: true });
}
