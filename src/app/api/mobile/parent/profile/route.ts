import { NextResponse } from "next/server";

import { softDeleteUser } from "@/lib/account-deletion";
import { recordAudit } from "@/lib/audit-log";
import { requireMobileParent } from "@/lib/mobile-auth";
import { normalizePhoneDigits } from "@/lib/phone-login";
import { prisma } from "@/lib/prisma";

/** GET /api/mobile/parent/profile — 학부모 프로필(모바일) */
export async function GET(request: Request) {
  const authResult = await requireMobileParent(request);
  if ("error" in authResult) return authResult.error;
  const { parent, userId } = authResult;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return NextResponse.json({ name: parent.name, phone: parent.phone, email: user?.email ?? null });
}

/** PATCH /api/mobile/parent/profile — 이름·전화번호 수정(모바일) */
export async function PATCH(request: Request) {
  const authResult = await requireMobileParent(request);
  if ("error" in authResult) return authResult.error;
  const { parent } = authResult;

  let body: { name?: unknown; phone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: { name?: string; phone?: string } = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (typeof body.phone === "string" && body.phone.trim()) {
    const digits = normalizePhoneDigits(body.phone);
    if (digits.length < 10) {
      return NextResponse.json({ error: "올바른 전화번호를 입력해 주세요." }, { status: 400 });
    }
    data.phone = digits;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await prisma.parent.update({ where: { id: parent.id }, data });
  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/mobile/parent/profile — 학부모 계정 탈퇴(모바일, 소프트삭제).
 * 학생 앱 DELETE /api/mobile/me와 동일 패턴. softDeleteUser가 자녀 연결 해제 포함.
 */
export async function DELETE(request: Request) {
  const authResult = await requireMobileParent(request);
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  try {
    await softDeleteUser(userId);
    recordAudit({
      actorUserId: userId,
      actorRole: "PARENT",
      action: "ACCOUNT_DELETE",
      targetType: "User",
      targetId: userId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[mobile/parent/profile] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
