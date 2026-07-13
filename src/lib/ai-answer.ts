import Anthropic from "@anthropic-ai/sdk";

export const MOCK_AI_ANSWER =
  "AI 답변 기능이 곧 활성화될 예정입니다. 선생님의 답변을 기다려주세요.";

export function isAiAnswerEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export async function generateAiAnswer(content: string, imageUrl: string | null) {
  if (!isAiAnswerEnabled()) {
    return MOCK_AI_ANSWER;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const userText = imageUrl
    ? `${content}\n\n(이미지도 첨부되어 있습니다)`
    : content;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system:
      "당신은 한국 중고등학생을 위한 친절한 과외 선생님입니다.\n" +
      "학생의 질문에 대해 명확하고 이해하기 쉽게 설명해주세요.\n" +
      "수식이 필요한 경우 단계별로 풀이해주세요.\n" +
      "답변은 한국어로 작성하세요.",
    messages: [{ role: "user", content: userText }],
  });

  const block = message.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : MOCK_AI_ANSWER;
}
