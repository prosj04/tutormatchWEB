import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import {
  clearLoginFailures,
  isLoginBlocked,
  loginRateLimitKey,
  recordLoginFailure,
} from "@/lib/login-rate-limit";
import { issueMobileTokens } from "@/lib/mobile-auth";
import {
  normalizePhoneDigits,
  parentSyntheticEmailFromDigits,
  studentSyntheticEmailFromDigits,
  teacherSyntheticEmailFromDigits,
} from "@/lib/phone-login";
import { prisma } from "@/lib/prisma";

const LOGIN_LOCKED_MESSAGE =
  "여러 번 실패해 잠시 잠겼어요. 약 15분 후 다시 시도해 주세요";

const userForAuthSelect = {
  id: true,
  email: true,
  password: true,
  role: true,
  deletedAt: true,
  student: { select: { name: true } },
  teacher: { select: { name: true } },
  parent: { select: { name: true } },
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

  // 웹(auth.ts)과 동일한 브루트포스 방어 — 잠금 시 시도 자체를 거부한다.
  const rateKey = loginRateLimitKey(identifier);
  if (isLoginBlocked(rateKey)) {
    return NextResponse.json({ error: LOGIN_LOCKED_MESSAGE }, { status: 429 });
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
      { parent: { phone: identifier } },
    ];
    if (digits.length >= 10) {
      orConditions.push(
        { email: studentSyntheticEmailFromDigits(digits) },
        { email: teacherSyntheticEmailFromDigits(digits) },
        { email: parentSyntheticEmailFromDigits(digits) },
        { student: { phone: digits } },
        { teacher: { phone: digits } },
        { parent: { phone: digits } },
      );
    }
    user = await prisma.user.findFirst({
      where: { OR: orConditions },
      select: userForAuthSelect,
    });
  }

  if (!user || !(await bcrypt.compare(password, user.password))) {
    recordLoginFailure(rateKey);
    return NextResponse.json(
      { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }
  // 자격 증명이 유효하면 실패 카운트 초기화 — 이후 정책성 거부는 잠금 대상 아님.
  clearLoginFailures(rateKey);

  // 탈퇴(소프트 삭제)한 계정은 로그인 차단 — 웹 auth.ts와 동일 정책.
  if (user.deletedAt) {
    return NextResponse.json(
      { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  // 통합 앱: 학생·학부모·선생님·매니저 모두 모바일 로그인 허용.
  // CHIEF_MANAGER·ADMIN은 웹 관리자 전용이므로 차단.
  const MOBILE_ALLOWED_ROLES = ["STUDENT", "PARENT", "TEACHER", "MANAGER"];
  if (!MOBILE_ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json(
      { error: "모바일 앱을 지원하지 않는 계정입니다. 웹 관리자 페이지를 이용해 주세요." },
      { status: 403 },
    );
  }

  const name =
    user.student?.name ??
    user.parent?.name ??
    user.teacher?.name ??
    user.email.split("@")[0];
  const tokens = issueMobileTokens(user.id, user.role);

  return NextResponse.json({
    ...tokens,
    user: { id: user.id, role: user.role, name },
  });
}
