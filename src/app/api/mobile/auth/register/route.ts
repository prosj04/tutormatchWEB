import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { issueMobileTokens } from "@/lib/mobile-auth";
import {
  normalizePhoneDigits,
  studentSyntheticEmailFromDigits,
} from "@/lib/phone-login";
import { prisma } from "@/lib/prisma";

/** POST /api/mobile/auth/register — 학생 계정 생성 */
export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown; phone?: unknown };
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
        },
      },
    },
    select: { id: true, role: true },
  });

  const tokens = issueMobileTokens(user.id, user.role);
  return NextResponse.json(tokens, { status: 201 });
}
