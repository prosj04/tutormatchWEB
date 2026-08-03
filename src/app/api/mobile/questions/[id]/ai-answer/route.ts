import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { consumeToken, getTokenWallet } from "@/lib/mobile-token-wallet";
import { resolveAiAnswer } from "@/lib/qna-ai-answer";

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/mobile/questions/[id]/ai-answer
 *  질문 등록 시 토큰 부족·AI 비활성으로 즉답이 붙지 않은 경우의 재요청 경로.
 *  웹과 같은 resolveAiAnswer를 쓰되, 모바일 토큰 경제를 우회하지 않도록
 *  신규 생성 시에만 토큰 1을 차감한다(이미 있는 답변 재조회는 무료).
 */
export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { id } = await context.params;
  const result = await resolveAiAnswer(student.id, id, {
    beforeGenerate: async () => (await consumeToken(student.id, 1)).ok,
    tokenCost: 1,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    aiAnswer: result.aiAnswer,
    wallet: await getTokenWallet(student.id),
  });
}
