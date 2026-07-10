import { NextResponse } from "next/server";

import { recordAudit } from "@/lib/audit-log";
import { requireManager } from "@/lib/manager-auth";
import { findResettableUser, resetUserPassword } from "@/lib/password";

/**
 * POST /api/manager/password-reset — 매니저가 학생·학부모 비밀번호 재설정(웹).
 * 문자·이메일 발송 인프라가 없어 비밀번호 분실 시 매니저가 대면으로 재설정한다.
 */
export async function POST(request: Request) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;

  let body: { identifier?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const identifier = typeof body.identifier === "string" ? body.identifier : "";
  if (!identifier.trim()) {
    return NextResponse.json(
      { error: "전화번호 또는 이메일을 입력해 주세요." },
      { status: 400 },
    );
  }

  const target = await findResettableUser(identifier);
  if (!target) {
    return NextResponse.json(
      { error: "해당 학생·학부모 계정을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const result = await resetUserPassword(target.id, body.newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  recordAudit({
    actorUserId: authResult.userId,
    actorRole: authResult.session.user.role ?? "MANAGER",
    action: "PASSWORD_RESET",
    targetType: "User",
    targetId: target.id,
    detail: `role=${target.role}`,
  });

  const name = target.student?.name ?? target.parent?.name ?? "";
  return NextResponse.json({ ok: true, target: { role: target.role, name } });
}
