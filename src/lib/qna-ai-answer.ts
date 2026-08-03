import { generateAiAnswer } from "@/lib/ai-answer";
import { prisma } from "@/lib/prisma";
import { answerAsAi } from "@/lib/qna";
import { checkRateLimit } from "@/lib/rate-limit";

export type AiAnswerResult =
  | { ok: true; aiAnswer: string }
  | { ok: false; status: number; error: string };

export type ResolveAiAnswerOptions = {
  /**
   * 신규 생성 직전에만 호출되는 과금 훅. false를 반환하면 생성하지 않고 402로 끝낸다.
   * 모바일은 토큰 지갑을 여기서 차감하고, 웹은 넘기지 않는다(과금 없음).
   */
  beforeGenerate?: () => Promise<boolean>;
  /** 생성된 AI 메시지에 기록할 토큰 소모량. */
  tokenCost?: number;
};

/**
 * 질문 루트 메시지에 AI 초안 답변을 붙인다. 이미 AI 답변이 있으면 그것을 그대로 반환.
 * 웹(`/api/questions/[id]/ai-answer`)·모바일(`/api/mobile/questions/[id]/ai-answer`)
 * 공용 — 레이트리밋 경계(학생당 분당 5회)까지 여기서 함께 건다.
 */
export async function resolveAiAnswer(
  studentId: string,
  questionId: string,
  options: ResolveAiAnswerOptions = {},
): Promise<AiAnswerResult> {
  if (!checkRateLimit("ai-answer", studentId, { windowMs: 60_000, max: 5 })) {
    return { ok: false, status: 429, error: "Too many requests" };
  }

  const root = await prisma.questionMessage.findFirst({
    where: {
      id: questionId,
      studentId,
      sender: "me",
      replyToId: null,
    },
    select: {
      id: true,
      body: true,
      imageUrl: true,
      teacherId: true,
      replies: {
        where: { sender: "ai" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { body: true },
      },
    },
  });

  if (!root) {
    return { ok: false, status: 404, error: "Question not found" };
  }

  const existingAi = root.replies[0];
  if (existingAi) {
    return { ok: true, aiAnswer: existingAi.body };
  }

  // 과금은 실제로 새로 생성할 때만 — 이미 있는 답변 재조회에는 토큰을 쓰지 않는다.
  if (options.beforeGenerate && !(await options.beforeGenerate())) {
    return { ok: false, status: 402, error: "토큰이 부족합니다" };
  }

  const aiAnswer = await generateAiAnswer(root.body, root.imageUrl);

  await answerAsAi({
    studentId,
    teacherId: root.teacherId,
    rootMessageId: root.id,
    body: aiAnswer,
    tokenCost: options.tokenCost,
  });

  return { ok: true, aiAnswer };
}
