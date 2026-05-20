/**
 * 관리자 비밀번호 재설정 — ADMIN_SETUP_SECRET 필요 (production).
 * 관리자 계정은 student/teacher가 없어 전화번호 로그인 불가 → 이메일만 허용.
 */
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { adminCount } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if ((await adminCount()) === 0) {
    return NextResponse.json({ error: "관리자 계정이 없습니다. 먼저 계정을 만드세요." }, { status: 404 });
  }

  const secret = process.env.ADMIN_SETUP_SECRET?.trim();
  const allowWithoutSecret = process.env.NODE_ENV !== "production";
  if (!secret && !allowWithoutSecret) {
    return NextResponse.json({ error: "ADMIN_SETUP_SECRET이 설정되지 않았습니다." }, { status: 503 });
  }

  let body: { email?: unknown; newPassword?: unknown; secretKey?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  const secretKey = typeof body.secretKey === "string" ? body.secretKey : "";

  if (!email || !email.includes("@") || newPassword.length < 8) {
    return NextResponse.json(
      { error: "이메일과 8자 이상의 새 비밀번호를 입력해 주세요." },
      { status: 400 },
    );
  }

  if (secret && secretKey !== secret) {
    return NextResponse.json({ error: "비밀키가 올바르지 않습니다." }, { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: { email, role: "ADMIN" },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "해당 이메일의 관리자 계정을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  return NextResponse.json({ ok: true });
}
