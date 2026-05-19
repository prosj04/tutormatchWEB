/** 공개 페이지별 CMS 섹션 기본값 (seed + 관리자 UI 공용) */

export const pricingPageDefaults = [
  { section: "pricing_page", key: "header_title", value: "1:1 맞춤 과외,\n월 40만원부터", type: "text", order: 1 },
  {
    section: "pricing_page",
    key: "header_subtext",
    value: "주 1회 회당 10만원, 주 2회 이상 회당 9만원입니다.\n1과목·2과목(선생님 2명) 패키지를 선택하세요.",
    type: "text",
    order: 2,
  },
  { section: "pricing_page", key: "plan4_title", value: "월 4회", type: "text", order: 3 },
  { section: "pricing_page", key: "plan4_price", value: "400,000원", type: "text", order: 4 },
  { section: "pricing_page", key: "plan4_subtitle", value: "주 1회 · 기본 집중", type: "text", order: 5 },
  {
    section: "pricing_page",
    key: "plan4_features",
    value: "주 1회 수업 (50분)\n학습 진도 관리\n과제 관리\nAI 질답 무제한\n강사 첨삭 월 4회",
    type: "text",
    order: 6,
  },
  { section: "pricing_page", key: "plan8_title", value: "월 8회", type: "text", order: 7 },
  { section: "pricing_page", key: "plan8_price", value: "720,000원", type: "text", order: 8 },
  { section: "pricing_page", key: "plan8_subtitle", value: "주 2회 · 집중 관리", type: "text", order: 9 },
  {
    section: "pricing_page",
    key: "plan8_features",
    value: "주 2회 수업 (50분)\n주 2회 집중 관리\n우선 강사 배정\nAI 질답 무제한\n강사 첨삭 무제한\n월간 심층 리포트",
    type: "text",
    order: 10,
  },
  { section: "pricing_page", key: "faq_title", value: "자주 묻는 질문", type: "text", order: 11 },
  {
    section: "pricing_page",
    key: "faq1_q",
    value: "수업 시간과 환불 규정은 어떻게 되나요?",
    type: "text",
    order: 12,
  },
  {
    section: "pricing_page",
    key: "faq1_a",
    value:
      "1회 수업은 50분 기준이며, 개강 전 결제 취소는 전액 환불됩니다. 개강 후에는 잔여 횟수에 비례하여 산정되며, 세부 약관은 계약서에 명시됩니다.",
    type: "text",
    order: 13,
  },
  {
    section: "pricing_page",
    key: "faq2_q",
    value: "강사 변경이 가능한가요?",
    type: "text",
    order: 14,
  },
  {
    section: "pricing_page",
    key: "faq2_a",
    value:
      "첫 2회 수업 이내에만 동일 요금제 범위에서 1회에 한해 변경이 가능합니다. 이후에는 매니저와 별도 협의가 필요합니다.",
    type: "text",
    order: 15,
  },
  {
    section: "pricing_page",
    key: "faq3_q",
    value: "AI 질답은 어떻게 이용하나요?",
    type: "text",
    order: 16,
  },
  {
    section: "pricing_page",
    key: "faq3_a",
    value:
      "가입 시 발급되는 학습 계정으로 24시간 질문이 가능하며, 강사 첨삭 횟수는 선택하신 플랜에 따라 월 4회 또는 무제한 혜택이 적용됩니다.",
    type: "text",
    order: 17,
  },
  {
    section: "pricing_page",
    key: "faq4_q",
    value: "결제 수단은 무엇이 있나요?",
    type: "text",
    order: 18,
  },
  {
    section: "pricing_page",
    key: "faq4_a",
    value: "체크아웃 페이지에서 카드, 간편결제 등 토스페이먼츠에서 제공하는 수단을 선택하실 수 있습니다.",
    type: "text",
    order: 19,
  },
] as const;

export const tutorsPageDefaults = [
  { section: "tutors_page", key: "header_title", value: "강사진", type: "text", order: 1 },
  {
    section: "tutors_page",
    key: "header_subtext",
    value: "관리자 승인이 완료된 선생님을 확인할 수 있습니다. 카드 내용은 관리자 페이지에서 수정한 정보가 바로 반영됩니다.",
    type: "text",
    order: 2,
  },
  { section: "tutors_page", key: "empty_title", value: "등록된 강사진이 없습니다.", type: "text", order: 3 },
  {
    section: "tutors_page",
    key: "empty_desc",
    value: "승인된 선생님이 생기면 이곳에 표시됩니다.",
    type: "text",
    order: 4,
  },
] as const;

export function parseMultilineList(value: string, fallback: string[]) {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : fallback;
}

export function getCmsSectionValue(
  siteContent: Record<string, Record<string, string>> | undefined,
  section: string,
  key: string,
  fallback: string,
) {
  return siteContent?.[section]?.[key] ?? fallback;
}
