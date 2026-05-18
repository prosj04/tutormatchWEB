import { prisma } from "@/lib/prisma";

const siteContentDefaults = [
  { section: "hero", key: "headline", value: "아이마다 맞는\n선생님이 다릅니다", type: "text", order: 1 },
  { section: "hero", key: "subtext", value: "전문 매니저가 직접 상담하고, 우리 아이에게 꼭 맞는 선생님을 찾아드립니다.", type: "text", order: 2 },
  { section: "hero", key: "cta_primary", value: "무료 상담 신청", type: "text", order: 3 },
  { section: "hero", key: "cta_secondary", value: "선생님 둘러보기", type: "text", order: 4 },
  { section: "hero", key: "bg_image_url", value: "", type: "image", order: 5 },

  { section: "stats", key: "stat1_number", value: "500+", type: "number", order: 1 },
  { section: "stats", key: "stat1_label", value: "누적 상담", type: "text", order: 2 },
  { section: "stats", key: "stat2_number", value: "1,200+", type: "number", order: 3 },
  { section: "stats", key: "stat2_label", value: "매칭 완료", type: "text", order: 4 },
  { section: "stats", key: "stat3_number", value: "98%", type: "number", order: 5 },
  { section: "stats", key: "stat3_label", value: "학생 만족도", type: "text", order: 6 },

  { section: "cta", key: "headline", value: "지금 신청하면 받을 수 있는 혜택이에요", type: "text", order: 1 },
  { section: "cta", key: "subtext", value: "무료 상담 1회 · 매니저 직접 배정 · 학습 리포트 무료 제공", type: "text", order: 2 },
  { section: "cta", key: "button", value: "무료 상담 신청하기", type: "text", order: 3 },

  { section: "features", key: "section_title", value: "이렇게 진행됩니다", type: "text", order: 1 },
  { section: "features", key: "section_subtext", value: "상담부터 매칭, 수업까지 1:1로 학생의 성장에 집중해요.", type: "text", order: 2 },
  { section: "features", key: "step1_title", value: "무료 상담 신청", type: "text", order: 3 },
  { section: "features", key: "step1_desc", value: "학생의 현재 성적, 목표, 성향을 간단히 남겨주세요.", type: "text", order: 4 },
  { section: "features", key: "step2_title", value: "매니저 배정 및 전화 상담", type: "text", order: 5 },
  { section: "features", key: "step2_desc", value: "10년 경력 매니저가 학습 상황과 가족의 우선순위를 듣습니다.", type: "text", order: 6 },
  { section: "features", key: "step3_title", value: "선생님 추천 및 매칭", type: "text", order: 7 },
  { section: "features", key: "step3_desc", value: "과목, 성향, 일정에 맞는 선생님 후보를 추천합니다.", type: "text", order: 8 },
];

const testimonialDefaults = [
  {
    quote: "공부하러 가서도 시간만 보내던 아이가 처음으로 공부 계획을 직접 잡고 실행했어요. 무조건 아무 선생님이나 매칭하는것이 아니라 정말 아이에 맞는 선생님을 고민하고 찾아주셔서 훨씬 안심됐습니다.",
    author: "고2 수학 · 학부모",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=640&h=520&fit=crop&q=80",
    order: 1,
  },
  {
    quote: "공부 잘 하는 선생님보다도 방황하는 아들의 방향을 잡아 줄 만한 선생님이 필요했는데, 정확히 맞는 선생님을 찾아줬어요.\n무엇보다 아이가 과외쌤처럼 되고 싶다며 열심히 하려고 하는 모습이 보여 정말 만족합니다",
    author: "고3 수학 · 학부모",
    imageUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=640&h=520&fit=crop&q=80",
    order: 2,
  },
  {
    quote: "숙제와 공부 계획을 등록하고 선생님이랑 같이 점검하니 자연스럽게 매일 공부하게 되더라구요. 성적보다 습관이 먼저 바뀌었어요.",
    author: "중3 영어 · 학생",
    imageUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=640&h=520&fit=crop&q=80",
    order: 3,
  },
];

const faqDefaults = [
  {
    question: "상담은 어떻게 진행되나요?",
    answer: "상담 신청 후 담당 매니저가 전화로 학생의 현재 수준, 목표, 일정, 성향을 확인합니다.",
    order: 1,
  },
  {
    question: "선생님 매칭은 얼마나 걸리나요?",
    answer: "상담 후 보통 1~3일 안에 후보 선생님을 추천드리며, 일정 조율 후 수업을 시작합니다.",
    order: 2,
  },
  {
    question: "수업 중간에 선생님을 바꿀 수 있나요?",
    answer: "첫 수업 이후 적합도가 맞지 않으면 매니저와 상의해 다른 선생님으로 조정할 수 있습니다.",
    order: 3,
  },
  {
    question: "환불 정책이 어떻게 되나요?",
    answer: "개강 전 취소는 전액 환불되며, 개강 후에는 이용한 수업 횟수를 제외하고 정산합니다.",
    order: 4,
  },
];

export async function seedDefaultCmsContent(adminUserId?: string) {
  const siteCount = await prisma.siteContent.count();

  if (siteCount === 0) {
    await prisma.siteContent.createMany({
      data: siteContentDefaults.map((item) => ({
        ...item,
        updatedBy: adminUserId ?? null,
      })),
    });
  }

  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({ data: testimonialDefaults });
  }

  const faqCount = await prisma.faqItem.count();
  if (faqCount === 0) {
    await prisma.faqItem.createMany({ data: faqDefaults });
  }

  return {
    siteContentSeeded: siteCount === 0,
    testimonialsSeeded: testimonialCount === 0,
    faqsSeeded: faqCount === 0,
  };
}
