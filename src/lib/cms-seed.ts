import { pricingPageDefaults, tutorsPageDefaults } from "@/lib/cms-page-defaults";
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
  { section: "features", key: "step4_title", value: "수업 시작", type: "text", order: 9 },
  { section: "features", key: "step4_desc", value: "첫 수업 후 적합도를 확인하고 필요한 조정을 진행합니다.", type: "text", order: 10 },
  { section: "features", key: "step5_title", value: "학습 리포트 & 관리", type: "text", order: 11 },
  { section: "features", key: "step5_desc", value: "진도, 숙제, 질문, 리포트를 한 흐름으로 관리합니다.", type: "text", order: 12 },
  { section: "features", key: "step1_image", value: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=840&h=380&fit=crop&q=80", type: "image", order: 13 },
  { section: "features", key: "step2_image", value: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=840&h=380&fit=crop&q=80", type: "image", order: 14 },
  { section: "features", key: "step3_image", value: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=840&h=380&fit=crop&q=80", type: "image", order: 15 },
  { section: "features", key: "step4_image", value: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=840&h=380&fit=crop&q=80", type: "image", order: 16 },
  { section: "features", key: "step5_image", value: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=840&h=380&fit=crop&q=80", type: "image", order: 17 },

  { section: "results", key: "section_title", value: "결과로 증명합니다", type: "text", order: 1 },
  { section: "results", key: "result1_student", value: "고2 학생", type: "text", order: 2 },
  { section: "results", key: "result1_before", value: "수학 5등급→", type: "text", order: 3 },
  { section: "results", key: "result1_after", value: "2등급으로 상승", type: "text", order: 4 },
  { section: "results", key: "result2_student", value: "중3 학생", type: "text", order: 5 },
  { section: "results", key: "result2_before", value: "영어 64점→", type: "text", order: 6 },
  { section: "results", key: "result2_after", value: "87점으로 상승", type: "text", order: 7 },
  { section: "results", key: "result3_student", value: "고1 학생", type: "text", order: 8 },
  { section: "results", key: "result3_before", value: "국어 55점→", type: "text", order: 9 },
  { section: "results", key: "result3_after", value: "78점으로 상승", type: "text", order: 10 },
  { section: "results", key: "result1_image", value: "/images/teachers/default-male.png", type: "image", order: 11 },
  { section: "results", key: "result2_image", value: "/images/teachers/default-female.png", type: "image", order: 12 },
  { section: "results", key: "result3_image", value: "/images/teachers/default-male.png", type: "image", order: 13 },

  { section: "teachers", key: "section_title", value: "명문대 출신부터\n경력 5년 이상\n전문가까지", type: "text", order: 1 },
  { section: "teachers", key: "section_subtext", value: "학생 성향과 목표에 딱 맞는 나만의 선생님을 배정해드립니다.", type: "text", order: 2 },
  { section: "teachers", key: "cta", value: "전체 선생님 보기", type: "text", order: 3 },
  { section: "teachers", key: "teacher1_subject", value: "수학", type: "text", order: 4 },
  { section: "teachers", key: "teacher1_name", value: "Teacher Noah", type: "text", order: 5 },
  { section: "teachers", key: "teacher1_image", value: "/images/teachers/default-male.png", type: "image", order: 6 },
  { section: "teachers", key: "teacher1_highlight", value: "전교꼴등에서 서울대학교 입학했어요", type: "text", order: 7 },
  { section: "teachers", key: "teacher1_careers", value: "서울대학교 수리과학부\n입시 수학 7년\n최상위권 심화반 운영", type: "text", order: 8 },
  { section: "teachers", key: "teacher2_subject", value: "영어", type: "text", order: 9 },
  { section: "teachers", key: "teacher2_name", value: "Teacher Olivia", type: "text", order: 10 },
  { section: "teachers", key: "teacher2_image", value: "/images/teachers/default-female.png", type: "image", order: 11 },
  { section: "teachers", key: "teacher2_highlight", value: "읽기 습관만 바꿔도 점수는 달라집니다", type: "text", order: 12 },
  { section: "teachers", key: "teacher2_careers", value: "연세대학교 영어영문학과\n국제학교/토플 지도\n첨삭 1,800시간+", type: "text", order: 13 },
  { section: "teachers", key: "teacher3_subject", value: "물리", type: "text", order: 14 },
  { section: "teachers", key: "teacher3_name", value: "Teacher Peter", type: "text", order: 15 },
  { section: "teachers", key: "teacher3_image", value: "/images/teachers/default-male.png", type: "image", order: 16 },
  { section: "teachers", key: "teacher3_highlight", value: "공식보다 먼저 직관을 세워요", type: "text", order: 17 },
  { section: "teachers", key: "teacher3_careers", value: "KAIST 전기및전자공학부\n물리·수학 통합 지도\nSTEM 멘토 수상", type: "text", order: 18 },
  { section: "teachers", key: "teacher4_subject", value: "국어", type: "text", order: 19 },
  { section: "teachers", key: "teacher4_name", value: "Teacher Jiwoo", type: "text", order: 20 },
  { section: "teachers", key: "teacher4_image", value: "/images/teachers/default-female.png", type: "image", order: 21 },
  { section: "teachers", key: "teacher4_highlight", value: "지문을 읽는 규칙을 훈련합니다", type: "text", order: 22 },
  { section: "teachers", key: "teacher4_careers", value: "서울대학교 국어국문학과\n논술 전문 프라이빗\n내신 국어 맞춤 관리", type: "text", order: 23 },

  { section: "management", key: "headline", value: "수업 밖에서도\n이어지는 학습 관리", type: "text", order: 1 },
  { section: "management", key: "subtext", value: "진도, 숙제, 질문, 리포트를 한 화면에서 연결해 학생·선생님·매니저가 같은 목표를 봅니다.", type: "text", order: 2 },
  { section: "management", key: "item1_title", value: "진도 관리", type: "text", order: 3 },
  { section: "management", key: "item1_desc", value: "주간 진도와 목표 달성률을 매니저·가정과 공유합니다.", type: "text", order: 4 },
  { section: "management", key: "item2_title", value: "질문 관리", type: "text", order: 5 },
  { section: "management", key: "item2_desc", value: "복습 질문에 대한 즉각 피드백으로 자기주도 학습을 돕습니다.", type: "text", order: 6 },
  { section: "management", key: "item3_title", value: "리포트", type: "text", order: 7 },
  { section: "management", key: "item3_desc", value: "월간 학습 데이터와 취약 유형 분석을 리포트로 제공합니다.", type: "text", order: 8 },

  ...pricingPageDefaults,
  ...tutorsPageDefaults,
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

const oldTeacherImageDefaults = [
  {
    oldValue: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80",
    newValue: "/images/teachers/default-male.png",
  },
  {
    oldValue: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80",
    newValue: "/images/teachers/default-female.png",
  },
  {
    oldValue: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80",
    newValue: "/images/teachers/default-male.png",
  },
  {
    oldValue: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80",
    newValue: "/images/teachers/default-female.png",
  },
];

export async function seedDefaultCmsContent(adminUserId?: string) {
  const siteCountBefore = await prisma.siteContent.count();

  await prisma.siteContent.createMany({
    data: siteContentDefaults.map((item) => ({
      ...item,
      updatedBy: adminUserId ?? null,
    })),
    skipDuplicates: true,
  });
  await Promise.all(
    oldTeacherImageDefaults.map((item) =>
      prisma.siteContent.updateMany({
        where: {
          section: "teachers",
          type: "image",
          value: item.oldValue,
        },
        data: {
          value: item.newValue,
          updatedBy: adminUserId ?? null,
        },
      }),
    ),
  );
  const siteCountAfter = await prisma.siteContent.count();

  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({ data: testimonialDefaults });
  }

  const faqCount = await prisma.faqItem.count();
  if (faqCount === 0) {
    await prisma.faqItem.createMany({ data: faqDefaults });
  }

  return {
    siteContentSeeded: siteCountAfter > siteCountBefore,
    testimonialsSeeded: testimonialCount === 0,
    faqsSeeded: faqCount === 0,
  };
}
