import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  normalizePhoneDigits,
  parentSyntheticEmailFromDigits,
  studentSyntheticEmailFromDigits,
} from "@/lib/phone-login";
import { prisma } from "@/lib/prisma";

/**
 * 비밀번호 변경·재설정 공통 로직.
 * 셀프서비스(현재 비밀번호 확인)와 매니저 재설정(확인 불필요)을 한 곳에서 관리한다.
 */

const MIN_PASSWORD_LENGTH = 8;

export type PasswordResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/** 새 비밀번호 형식 검증. 문제 없으면 null. */
function validateNewPassword(value: unknown): string | null {
  if (typeof value !== "string" || value.length < MIN_PASSWORD_LENGTH) {
    return "8자 이상의 새 비밀번호를 입력해 주세요.";
  }
  return null;
}

/** 로그인 사용자가 현재 비밀번호 확인 후 스스로 변경. */
export async function changeOwnPassword(
  userId: string,
  currentPassword: unknown,
  newPassword: unknown,
): Promise<PasswordResult> {
  const invalid = validateNewPassword(newPassword);
  if (invalid) return { ok: false, status: 400, error: invalid };
  if (typeof currentPassword !== "string" || !currentPassword) {
    return { ok: false, status: 400, error: "현재 비밀번호를 입력해 주세요." };
  }
  if (currentPassword === newPassword) {
    return {
      ok: false,
      status: 400,
      error: "기존 비밀번호와 다른 비밀번호를 입력해 주세요.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user) return { ok: false, status: 404, error: "계정을 찾을 수 없습니다." };
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return { ok: false, status: 401, error: "현재 비밀번호가 올바르지 않습니다." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(newPassword as string, 12) },
  });
  return { ok: true };
}

/** 매니저·관리자가 대상 사용자의 비밀번호를 재설정(현재 비밀번호 불필요). */
export async function resetUserPassword(
  targetUserId: string,
  newPassword: unknown,
): Promise<PasswordResult> {
  const invalid = validateNewPassword(newPassword);
  if (invalid) return { ok: false, status: 400, error: invalid };

  await prisma.user.update({
    where: { id: targetUserId },
    data: { password: await bcrypt.hash(newPassword as string, 12) },
  });
  return { ok: true };
}

/**
 * 매니저 재설정 대상을 식별자(전화번호·이메일)로 조회.
 * 학생·학부모만 대상(강사·매니저·관리자 계정은 재설정 불가), 탈퇴 계정 제외.
 */
export async function findResettableUser(identifier: string) {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  let match: Prisma.UserWhereInput;
  if (trimmed.includes("@")) {
    match = { email: trimmed.toLowerCase() };
  } else {
    const digits = normalizePhoneDigits(trimmed);
    const or: Prisma.UserWhereInput[] = [
      { student: { phone: trimmed } },
      { parent: { phone: trimmed } },
    ];
    if (digits.length >= 10) {
      or.push(
        { email: studentSyntheticEmailFromDigits(digits) },
        { email: parentSyntheticEmailFromDigits(digits) },
        { student: { phone: digits } },
        { parent: { phone: digits } },
      );
    }
    match = { OR: or };
  }

  return prisma.user.findFirst({
    where: { ...match, role: { in: ["STUDENT", "PARENT"] }, deletedAt: null },
    select: {
      id: true,
      role: true,
      student: { select: { name: true } },
      parent: { select: { name: true } },
    },
  });
}
