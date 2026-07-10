import { NextResponse } from "next/server";

import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { logAnalyticsEvent } from "@/lib/analytics";
import { requireMobileParent } from "@/lib/mobile-auth";
import { linkParentByCode } from "@/lib/parent-link";

const LINK_ERROR_MESSAGE: Record<string, string> = {
  INVALID_CODE: "유효하지 않은 코드입니다.",
  EXPIRED: "만료된 코드입니다. 자녀에게 코드를 다시 요청해 주세요.",
  USED: "이미 사용된 코드입니다.",
};

/** POST /api/mobile/parent/link — 코드/QR로 자녀 연결(모바일) */
export async function POST(request: Request) {
  const authResult = await requireMobileParent(request);
  if ("error" in authResult) return authResult.error;
  const { parent, userId } = authResult;

  let body: { code?: unknown; via?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  const via = body.via === "QR" ? "QR" : "CODE";
  if (!code.trim()) {
    return NextResponse.json({ error: "코드를 입력해 주세요." }, { status: 400 });
  }

  const result = await linkParentByCode(parent.id, code, via);
  if (!result.ok) {
    return NextResponse.json(
      { error: LINK_ERROR_MESSAGE[result.reason] ?? "연결에 실패했습니다." },
      { status: result.reason === "INVALID_CODE" ? 404 : 409 },
    );
  }

  if (!result.alreadyLinked) {
    logAnalyticsEvent({
      name: ANALYTICS_EVENTS.parentChildLinked,
      userId,
      platform: "mobile",
      payload: { via },
    });
  }

  return NextResponse.json({ ok: true, studentId: result.studentId, alreadyLinked: result.alreadyLinked });
}
