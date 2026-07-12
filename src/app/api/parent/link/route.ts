import { NextResponse } from "next/server";

import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { logAnalyticsEvent } from "@/lib/analytics";
import { linkParentByCode } from "@/lib/parent-link";
import { parentLinkRateLimited } from "@/lib/parent-link-rate-limit";
import { requireParent } from "@/lib/parent-page-auth";

const LINK_ERROR_MESSAGE: Record<string, string> = {
  INVALID_CODE: "유효하지 않은 코드입니다.",
  EXPIRED: "만료된 코드입니다. 자녀에게 코드를 다시 요청해 주세요.",
  USED: "이미 사용된 코드입니다.",
};

/** POST /api/parent/link — 코드/QR로 자녀 연결(웹) */
export async function POST(request: Request) {
  const authResult = await requireParent();
  if ("error" in authResult) return authResult.error;
  const { parent } = authResult;

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

  // 링크코드 브루트포스 방어 — parentId 기준 10회/15분 초과 시 429
  if (parentLinkRateLimited(parent.id)) {
    return NextResponse.json(
      { error: "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
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
      userId: authResult.userId,
      platform: "web",
      payload: { via },
    });
  }

  return NextResponse.json({ ok: true, studentId: result.studentId, alreadyLinked: result.alreadyLinked });
}
