import { NextResponse } from "next/server";

import { getMobileUser } from "@/lib/mobile-auth";
import { changeOwnPassword } from "@/lib/password";

/** POST /api/mobile/me/password — 로그인 사용자 본인 비밀번호 변경(모바일) */
export async function POST(request: Request) {
  const payload = await getMobileUser(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await changeOwnPassword(
    payload.sub,
    body.currentPassword,
    body.newPassword,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
