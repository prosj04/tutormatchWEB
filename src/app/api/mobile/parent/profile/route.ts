import { NextResponse } from "next/server";

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
