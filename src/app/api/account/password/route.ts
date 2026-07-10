import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { changeOwnPassword } from "@/lib/password";

/** POST /api/account/password — 로그인 사용자 본인 비밀번호 변경(웹) */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await changeOwnPassword(
    session.user.id,
    body.currentPassword,
    body.newPassword,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
