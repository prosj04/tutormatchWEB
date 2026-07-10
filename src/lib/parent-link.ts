import crypto from "crypto";

import { prisma } from "@/lib/prisma";

/** 학부모 연결 코드 유효 시간(분). QR도 동일 코드를 인코딩한다. */
const LINK_CODE_TTL_MIN = 15;

/** 혼동하기 쉬운 문자(0/O, 1/I) 제외한 코드 알파벳. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function randomCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/**
 * 학생용 학부모 연결 코드 발급. 기존 미사용 코드는 만료 처리하고 새로 발급한다.
 * 반환된 code를 QR로 인코딩해 학생 화면에 표시한다.
 */
export async function issueParentLinkCode(
  studentId: string,
): Promise<{ code: string; expiresAt: Date }> {
  // 기존 미사용·미만료 코드는 즉시 만료시켜 한 번에 하나만 유효하게 유지
  await prisma.parentLinkCode.updateMany({
    where: { studentId, usedAt: null, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() },
  });

  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MIN * 60 * 1000);

  // code는 unique — 충돌 시 재시도
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode();
    try {
      await prisma.parentLinkCode.create({
        data: { studentId, code, expiresAt },
      });
      return { code, expiresAt };
    } catch {
      // unique 충돌 — 재시도
    }
  }
  throw new Error("LINK_CODE_GENERATION_FAILED");
}

export type ParentLinkResult =
  | { ok: true; studentId: string; alreadyLinked: boolean }
  | { ok: false; reason: "INVALID_CODE" | "EXPIRED" | "USED" };

/**
 * 학부모가 코드/QR로 자녀를 연결. 코드 검증 → ParentStudent 생성 → 코드 사용 처리.
 * 이미 연결된 경우 alreadyLinked=true로 성공 처리(멱등).
 */
export async function linkParentByCode(
  parentId: string,
  rawCode: string,
  via: "CODE" | "QR",
): Promise<ParentLinkResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, reason: "INVALID_CODE" };

  const record = await prisma.parentLinkCode.findUnique({ where: { code } });
  if (!record) return { ok: false, reason: "INVALID_CODE" };
  if (record.usedAt) return { ok: false, reason: "USED" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "EXPIRED" };

  const existing = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId, studentId: record.studentId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.parentLinkCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return { ok: true, studentId: record.studentId, alreadyLinked: true };
  }

  await prisma.$transaction([
    prisma.parentStudent.create({
      data: { parentId, studentId: record.studentId, linkedVia: via },
    }),
    prisma.parentLinkCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true, studentId: record.studentId, alreadyLinked: false };
}

/** 매니저 수동 연결(코드 없이 parentId↔studentId 직접 연결). 멱등. */
export async function linkParentManual(
  parentId: string,
  studentId: string,
): Promise<{ ok: true; alreadyLinked: boolean }> {
  const existing = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId, studentId } },
    select: { id: true },
  });
  if (existing) return { ok: true, alreadyLinked: true };

  await prisma.parentStudent.create({
    data: { parentId, studentId, linkedVia: "MANAGER" },
  });
  return { ok: true, alreadyLinked: false };
}
