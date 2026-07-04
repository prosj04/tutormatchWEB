import { NextResponse } from "next/server";

/**
 * 크론 엔드포인트 인증. Vercel Cron은 CRON_SECRET 설정 시
 * `Authorization: Bearer <CRON_SECRET>` 헤더를 자동 부착한다.
 * `x-vercel-cron` 헤더는 외부에서 위조 가능하므로 신뢰하지 않는다.
 * 통과 시 null, 실패 시 응답을 반환한다.
 */
export function authorizeCron(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  if (request.headers.get("Authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
