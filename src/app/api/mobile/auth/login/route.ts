import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { issueMobileTokens } from "@/lib/mobile-auth";
import {
  normalizePhoneDigits,
  studentSyntheticEmailFromDigits,
  teacherSyntheticEmailFromDigits,
} from "@/lib/phone-login";
import { prisma } from "@/lib/prisma";

const userForAuthSelect = {
  id: true,
  email: true,
  password: true,
  role: true,
  deletedAt: true,
  student: { select: { name: true } },
  teacher: { select: { name: true } },
} satisfies Prisma.UserSelect;

export async function POST(request: Request) {
  let body: { identifier?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const invisible = /[\u200B-\u200D\uFEFF]/g;
  const identifier =
    typeof body.identifier === "string"
      ? body.identifier.replace(invisible, "").trim()
      : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifier || !password) {
    return NextResponse.json(
      { error: "아이디와 비밀번호를 입력해 주세요." },
      { status: 400 },
    );
  }

  let user: Prisma.UserGetPayload<{ select: typeof userForAuthSelect }> | null =
    null;

  if (identifier.includes("@")) {
    user = await prisma.user.findUnique({
      where: { email: identifier.toLowerCase() },
      select: userForAuthSelect,
    });
  } else {
    const digits = normalizePhoneDigits(identifier);
    const orConditions: Prisma.UserWhereInput[] = [
      { student: { phone: identifier } },
      { teacher: { phone: identifier } },
    ];
    if (digits.length >= 10) {
      orConditions.push(
        { email: studentSyntheticEmailFromDigits(digits) },
        { email: teacherSyntheticEmailFromDigits(digits) },
        { student: { phone: digits } },
        { teacher: { phone: digits } },
      );
    }
    user = await prisma.user.findFirst({
      where: { OR: orConditions },
      select: userForAuthSelect,
    });
  }

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json(
      { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  // 탈퇴(소프트 삭제)한 계정은 로그인 차단 — 웹 auth.ts와 동일 정책.
  if (user.deletedAt) {
    return NextResponse.json(
      { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  const name =
    user.student?.name ?? user.teacher?.name ?? user.email.split("@")[0];
  const tokens = issueMobileTokens(user.id, user.role);

  return NextResponse.json({
    ...tokens,
    user: { id: user.id, role: user.role, name },
  });
}
