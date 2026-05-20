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
  {
    section: "tutors_page",
    key: "public_photo_male",
    value: "/images/teachers/default-male.png",
    type: "image",
    order: 5,
  },
  {
    section: "tutors_page",
    key: "public_photo_female",
    value: "/images/teachers/default-female.png",
    type: "image",
    order: 6,
  },
] as const;

/** FAQ·후기·로그인·결제 등 공개 페이지 고정 영역 (항목 본문은 DB 테이블) */
export const extraPublicPagesDefaults = [
  { section: "faq_page", key: "kicker", value: "FAQ", type: "text", order: 1 },
  {
    section: "faq_page",
    key: "title",
    value: "자주 묻는 질문",
    type: "text",
    order: 2,
  },
  {
    section: "faq_page",
    key: "subtext",
    value: "서비스 이용 전 궁금한 점을 모았습니다.",
    type: "text",
    order: 3,
  },
  { section: "faq_page", key: "empty_text", value: "등록된 FAQ가 없습니다.", type: "text", order: 4 },

  { section: "reviews_page", key: "kicker", value: "REVIEWS", type: "text", order: 1 },
  { section: "reviews_page", key: "title", value: "학습 후기", type: "text", order: 2 },
  {
    section: "reviews_page",
    key: "subtext",
    value: "실제 학부모·학생이 남긴 후기를 모았습니다.",
    type: "text",
    order: 3,
  },
  {
    section: "reviews_page",
    key: "empty_text",
    value: "등록된 후기가 없습니다.",
    type: "text",
    order: 4,
  },

  { section: "login_page", key: "kicker", value: "Account", type: "text", order: 1 },
  { section: "login_page", key: "title", value: "로그인", type: "text", order: 2 },
  {
    section: "login_page",
    key: "subtext",
    value: "이메일 또는 전화번호와 비밀번호로 Concord 계정에 로그인하세요.",
    type: "text",
    order: 3,
  },
  { section: "login_page", key: "signup_prompt", value: "아직 계정이 없으신가요? ", type: "text", order: 4 },
  { section: "login_page", key: "signup_cta", value: "상담 신청", type: "text", order: 5 },

  { section: "checkout_page", key: "header_kicker", value: "Checkout", type: "text", order: 1 },
  { section: "checkout_page", key: "header_title", value: "결제", type: "text", order: 2 },
  { section: "checkout_page", key: "link_pricing", value: "← 요금제", type: "text", order: 3 },
  { section: "checkout_page", key: "link_consultation", value: "상담 먼저 신청하기", type: "text", order: 4 },
  { section: "checkout_page", key: "section_order_title", value: "주문 요약", type: "text", order: 5 },
  { section: "checkout_page", key: "dt_plan", value: "플랜", type: "text", order: 6 },
  { section: "checkout_page", key: "dt_subjects", value: "과목 수", type: "text", order: 7 },
  { section: "checkout_page", key: "dt_tutor", value: "강사", type: "text", order: 8 },
  { section: "checkout_page", key: "dt_platform", value: "플랫폼 이용료", type: "text", order: 9 },
  { section: "checkout_page", key: "dt_lesson", value: "수업료", type: "text", order: 10 },
  { section: "checkout_page", key: "dt_total", value: "총 결제금액", type: "text", order: 11 },
  { section: "checkout_page", key: "section_payment_title", value: "결제 수단", type: "text", order: 12 },
  {
    section: "checkout_page",
    key: "payment_note",
    value: "테스트 키로 연동되어 실제 결제는 이루어지지 않습니다.",
    type: "text",
    order: 13,
  },
  { section: "checkout_page", key: "section_customer_title", value: "주문자 정보", type: "text", order: 14 },
  { section: "checkout_page", key: "label_name", value: "이름", type: "text", order: 15 },
  { section: "checkout_page", key: "label_phone", value: "연락처", type: "text", order: 16 },
  { section: "checkout_page", key: "label_email", value: "이메일", type: "text", order: 17 },
  {
    section: "checkout_page",
    key: "terms_text",
    value: "전자상거래 및 결제 관련 약관, 개인정보 처리방침에 동의합니다. (필수)",
    type: "text",
    order: 18,
  },
  { section: "checkout_page", key: "pay_button", value: "결제하기", type: "text", order: 19 },
  { section: "checkout_page", key: "paying_label", value: "처리 중…", type: "text", order: 20 },
  { section: "checkout_page", key: "widget_loading", value: "결제 UI를 불러오는 중…", type: "text", order: 21 },
  {
    section: "checkout_page",
    key: "fail_banner",
    value: "결제가 완료되지 않았습니다. 다시 시도하거나 다른 수단을 선택해 주세요.",
    type: "text",
    order: 22,
  },

  { section: "success_page", key: "kicker", value: "Payment", type: "text", order: 1 },
  { section: "success_page", key: "title", value: "결제가 완료되었습니다", type: "text", order: 2 },
  {
    section: "success_page",
    key: "body",
    value: "주문이 정상적으로 접수되었습니다. 담당 매니저가 곧 연락드릴 예정입니다.",
    type: "text",
    order: 3,
  },
  { section: "success_page", key: "label_order", value: "주문번호", type: "text", order: 4 },
  { section: "success_page", key: "label_payment_key", value: "결제키", type: "text", order: 5 },
  { section: "success_page", key: "label_amount", value: "승인 금액", type: "text", order: 6 },
  {
    section: "success_page",
    key: "missing_payment_info",
    value: "결제 확인 정보가 URL에 포함되지 않았습니다. 매니저 확인용 메일을 확인해 주세요.",
    type: "text",
    order: 7,
  },
  { section: "success_page", key: "link_home", value: "홈으로", type: "text", order: 8 },
  { section: "success_page", key: "link_consultation", value: "상담 신청", type: "text", order: 9 },
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

/** 강사진 공개 목록·상세: 업로드 사진 대신 CMS에서 지정한 성별 기본 얼굴 */
export function getTutorPublicPhotoUrl(
  gender: string | null | undefined,
  siteContent: Record<string, Record<string, string>> | undefined,
): string {
  const male = getCmsSectionValue(
    siteContent,
    "tutors_page",
    "public_photo_male",
    "/images/teachers/default-male.png",
  );
  const female = getCmsSectionValue(
    siteContent,
    "tutors_page",
    "public_photo_female",
    "/images/teachers/default-female.png",
  );
  if (gender === "FEMALE") return female;
  return male;
}
