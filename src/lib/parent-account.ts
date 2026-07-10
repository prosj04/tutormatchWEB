import bcrypt from "bcryptjs";

import {
  normalizePhoneDigits,
  parentSyntheticEmailFromDigits,
} from "@/lib/phone-login";
import { prisma } from "@/lib/prisma";

export type CreateParentInput = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  phone?: unknown;
};

export type CreateParentResult =
  | { ok: true; userId: string; role: "PARENT" }
  | { ok: false; status: number; error: string };

/**
 * 학부모 계정 생성(웹·모바일 공용). 전화번호 기반 로그인, 이메일 미입력 시 합성 이메일.
 * 학생과 달리 보호자 동의 절차는 없다(성인 계정 전제).
 */
export async function createParentAccount(
  input: CreateParentInput,
): Promise<CreateParentResult> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const rawEmail =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";

  if (!name || !password || !phone) {
    return { ok: false, status: 400, error: "이름, 비밀번호, 전화번호를 입력해 주세요." };
  }
  if (password.length < 8) {
    return { ok: false, status: 400, error: "비밀번호는 8자 이상이어야 합니다." };
  }

  const digits = normalizePhoneDigits(phone);
  if (digits.length < 10) {
    return { ok: false, status: 400, error: "올바른 전화번호를 입력해 주세요." };
  }

  const email = rawEmail || parentSyntheticEmailFromDigits(digits);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { parent: { phone: digits } }] },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, status: 409, error: "이미 가입된 전화번호 또는 이메일입니다." };
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: "PARENT",
      parent: { create: { name, phone: digits } },
    },
    select: { id: true },
  });

  return { ok: true, userId: user.id, role: "PARENT" };
}
