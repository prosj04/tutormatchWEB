import {
  compareDefaults,
  cmsTextStyleDefaults,
  extraPublicPagesDefaults,
  footerDefaults,
  homeBenchmarkSectionsDefaults,
  homeSafetyStoryDefaults,
  homeLabelsDefaults,
  homePageVisibilityDefaults,
  portalPagesDefaults,
  pricingPageDefaults,
  spacingDefaults,
  tutorsPageDefaults,
  tutorsFeaturedDefaults,
  tutorsBenchmarkDefaults,
  reviewsBenchmarkDefaults,
} from "@/lib/cms-page-defaults";
import { prisma } from "@/lib/prisma";
import { LEGACY_RESULT_IMAGE_PLACEHOLDERS, RESULT_CARD_IMAGES } from "@/lib/result-card-images";

const siteContentDefaults = [
  { section: "hero", key: "headline", value: "학생마다 맞는\n선생님이 다릅니다", type: "text", order: 1 },
  { section: "hero", key: "subtext", value: "2학기를 뒤집는 여름방학, 잘 맞는 선생님에서 시작됩니다.", type: "text", order: 2 },
  { section: "hero", key: "cta_primary", value: "딱 맞는 선생님 추천받기", type: "text", order: 3 },
  { section: "hero", key: "cta_secondary", value: "선생님 둘러보기", type: "text", order: 4 },
  { section: "hero", key: "bg_image_url", value: "", type: "image", order: 5 },
  { section: "hero", key: "trust_text", value: "", type: "text", order: 6 },

  { section: "stats", key: "stat_visible", value: "0", type: "text", order: 0 },
  { section: "stats", key: "stat1_number", value: "", type: "number", order: 1 },
  { section: "stats", key: "stat1_label", value: "누적 상담", type: "text", order: 2 },
  { section: "stats", key: "stat2_number", value: "", type: "number", order: 3 },
  { section: "stats", key: "stat2_label", value: "매칭 완료", type: "text", order: 4 },
  { section: "stats", key: "stat3_number", value: "", type: "number", order: 5 },
  { section: "stats", key: "stat3_label", value: "학생 만족도", type: "text", order: 6 },

  { section: "cta", key: "headline", value: "판단은 첫 수업을 보고 하셔도 됩니다.", type: "text", order: 1 },
  { section: "cta", key: "subtext", value: "결정은 천천히, 진단은 먼저 받아보세요.", type: "text", order: 2 },
  { section: "cta", key: "button", value: "지금 무료 상담 신청하기", type: "text", order: 3 },
  { section: "cta", key: "cta_box_1_visible", value: "1", type: "text", order: 10 },
  { section: "cta", key: "cta_box_1_title", value: "무료 상담 1회", type: "text", order: 11 },
  { section: "cta", key: "cta_box_1_desc", value: "매니저가 직접 학생 상황을 파악합니다.", type: "text", order: 12 },
  {
    section: "cta",
    key: "cta_box_1_detail",
    value: "현재 성적·목표·일정을 함께 정리하고, 가장 현실적인 학습 방향을 제안해 드립니다.",
    type: "text",
    order: 13,
  },
  { section: "cta", key: "cta_box_2_visible", value: "1", type: "text", order: 14 },
  { section: "cta", key: "cta_box_2_title", value: "1~3일 내 선생님 배정", type: "text", order: 15 },
  { section: "cta", key: "cta_box_2_desc", value: "상담 다음날부터 선생님 후보를 추천합니다.", type: "text", order: 16 },
  {
    section: "cta",
    key: "cta_box_2_detail",
    value: "검증된 선생님 중 과목·성향·일정에 맞는 최적의 후보를 선별합니다.",
    type: "text",
    order: 17,
  },
  { section: "cta", key: "cta_box_3_visible", value: "1", type: "text", order: 18 },
  { section: "cta", key: "cta_box_3_title", value: "첫 수업 100% 환불 보장", type: "text", order: 19 },
  { section: "cta", key: "cta_box_3_desc", value: "맞지 않으면 위약금 없이 전액 환불합니다.", type: "text", order: 20 },
  {
    section: "cta",
    key: "cta_box_3_detail",
    value: "첫 수업 이후 불만족 시 어떠한 조건 없이 즉시 환불 처리합니다.",
    type: "text",
    order: 21,
  },
  { section: "cta", key: "cta_box_4_visible", value: "1", type: "text", order: 22 },
  { section: "cta", key: "cta_box_4_title", value: "매니저 직속 관리", type: "text", order: 23 },
  { section: "cta", key: "cta_box_4_desc", value: "선생님·학생·학부모를 하나로 연결합니다.", type: "text", order: 24 },
  {
    section: "cta",
    key: "cta_box_4_detail",
    value: "불편한 요청도 매니저가 대신 전달합니다. 수업 기록은 앱에서 바로 확인하세요.",
    type: "text",
    order: 25,
  },
  { section: "cta", key: "cta_box_5_visible", value: "0", type: "text", order: 26 },
  { section: "cta", key: "cta_box_5_title", value: "", type: "text", order: 27 },
  { section: "cta", key: "cta_box_5_desc", value: "", type: "text", order: 28 },
  { section: "cta", key: "cta_box_5_detail", value: "", type: "text", order: 29 },
  { section: "cta", key: "cta_box_6_visible", value: "0", type: "text", order: 30 },
  { section: "cta", key: "cta_box_6_title", value: "", type: "text", order: 31 },
  { section: "cta", key: "cta_box_6_desc", value: "", type: "text", order: 32 },
  { section: "cta", key: "cta_box_6_detail", value: "", type: "text", order: 33 },

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
  { section: "features", key: "step1_visible", value: "1", type: "text", order: 18 },
  { section: "features", key: "step2_visible", value: "1", type: "text", order: 19 },
  { section: "features", key: "step3_visible", value: "1", type: "text", order: 20 },
  { section: "features", key: "step4_visible", value: "1", type: "text", order: 21 },
  { section: "features", key: "step5_visible", value: "1", type: "text", order: 22 },
  { section: "features", key: "step6_visible", value: "0", type: "text", order: 23 },
  { section: "features", key: "step6_title", value: "", type: "text", order: 24 },
  { section: "features", key: "step6_desc", value: "", type: "text", order: 25 },
  {
    section: "features",
    key: "step6_image",
    value: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=840&h=380&fit=crop&q=80",
    type: "image",
    order: 26,
  },

  { section: "results", key: "section_title", value: "결과로 증명합니다", type: "text", order: 1 },
  { section: "results", key: "result1_student", value: "고2 학생", type: "text", order: 2 },
  { section: "results", key: "result1_before", value: "수학 5등급", type: "text", order: 3 },
  { section: "results", key: "result1_after", value: "2등급으로 상승", type: "text", order: 4 },
  { section: "results", key: "result1_months", value: "3개월", type: "text", order: 4 },
  { section: "results", key: "result2_student", value: "중3 학생", type: "text", order: 5 },
  { section: "results", key: "result2_before", value: "영어 64점", type: "text", order: 6 },
  { section: "results", key: "result2_after", value: "87점으로 상승", type: "text", order: 7 },
  { section: "results", key: "result2_months", value: "4개월", type: "text", order: 7 },
  { section: "results", key: "result3_student", value: "고1 학생", type: "text", order: 8 },
  { section: "results", key: "result3_before", value: "국어 55점", type: "text", order: 9 },
  { section: "results", key: "result3_after", value: "78점으로 상승", type: "text", order: 10 },
  { section: "results", key: "result3_months", value: "3개월", type: "text", order: 10 },
  { section: "results", key: "result1_image", value: RESULT_CARD_IMAGES[0], type: "image", order: 11 },
  { section: "results", key: "result2_image", value: RESULT_CARD_IMAGES[1], type: "image", order: 12 },
  { section: "results", key: "result3_image", value: RESULT_CARD_IMAGES[2], type: "image", order: 13 },
  { section: "results", key: "result1_visible", value: "1", type: "text", order: 14 },
  { section: "results", key: "result2_visible", value: "1", type: "text", order: 15 },
  { section: "results", key: "result3_visible", value: "1", type: "text", order: 16 },
  { section: "results", key: "result4_visible", value: "1", type: "text", order: 17 },
  { section: "results", key: "result5_visible", value: "1", type: "text", order: 18 },
  { section: "results", key: "result6_visible", value: "1", type: "text", order: 19 },
  { section: "results", key: "result4_student", value: "중2 학생", type: "text", order: 20 },
  { section: "results", key: "result4_before", value: "수학 85점", type: "text", order: 21 },
  { section: "results", key: "result4_after", value: "100점으로 상승", type: "text", order: 22 },
  { section: "results", key: "result4_months", value: "2개월", type: "text", order: 22 },
  { section: "results", key: "result5_student", value: "고3 학생", type: "text", order: 23 },
  { section: "results", key: "result5_before", value: "영어 5등급", type: "text", order: 24 },
  { section: "results", key: "result5_after", value: "3등급으로 상승", type: "text", order: 25 },
  { section: "results", key: "result5_months", value: "5개월", type: "text", order: 25 },
  { section: "results", key: "result6_student", value: "고1 학생", type: "text", order: 26 },
  { section: "results", key: "result6_before", value: "수학 69점", type: "text", order: 27 },
  { section: "results", key: "result6_after", value: "92점으로 상승", type: "text", order: 28 },
  { section: "results", key: "result6_months", value: "3개월", type: "text", order: 28 },
  { section: "results", key: "result4_image", value: RESULT_CARD_IMAGES[3], type: "image", order: 29 },
  { section: "results", key: "result5_image", value: RESULT_CARD_IMAGES[4], type: "image", order: 30 },
  { section: "results", key: "result6_image", value: RESULT_CARD_IMAGES[5], type: "image", order: 31 },

  { section: "teachers", key: "section_title", value: "명문대 출신부터\n경력 5년 이상\n전문가까지", type: "text", order: 1 },
  { section: "teachers", key: "section_subtext", value: "학생 성향과 목표에 딱 맞는 나만의 선생님을 배정해드립니다.", type: "text", order: 2 },
  { section: "teachers", key: "cta", value: "전체 선생님 보기", type: "text", order: 3 },

  { section: "teachers", key: "teacher1_visible", value: "1", type: "text", order: 10 },
  { section: "teachers", key: "teacher1_subject", value: "수학", type: "text", order: 11 },
  { section: "teachers", key: "teacher1_name", value: "Teacher Noah", type: "text", order: 12 },
  { section: "teachers", key: "teacher1_image", value: "/images/teachers/default-male.png", type: "image", order: 13 },
  { section: "teachers", key: "teacher1_highlight", value: "전교꼴등에서 서울대학교 입학했어요", type: "text", order: 14 },
  { section: "teachers", key: "teacher1_careers", value: "서울대학교 수리과학부\n입시 수학 7년\n최상위권 심화반 운영", type: "text", order: 15 },

  { section: "teachers", key: "teacher2_visible", value: "1", type: "text", order: 20 },
  { section: "teachers", key: "teacher2_subject", value: "영어", type: "text", order: 21 },
  { section: "teachers", key: "teacher2_name", value: "Teacher Olivia", type: "text", order: 22 },
  { section: "teachers", key: "teacher2_image", value: "/images/teachers/default-female.png", type: "image", order: 23 },
  { section: "teachers", key: "teacher2_highlight", value: "읽기 습관만 바꿔도 점수는 달라집니다", type: "text", order: 24 },
  { section: "teachers", key: "teacher2_careers", value: "연세대학교 영어영문학과\n국제학교/토플 지도\n첨삭 1,800시간+", type: "text", order: 25 },

  { section: "teachers", key: "teacher3_visible", value: "1", type: "text", order: 30 },
  { section: "teachers", key: "teacher3_subject", value: "물리", type: "text", order: 31 },
  { section: "teachers", key: "teacher3_name", value: "Teacher Peter", type: "text", order: 32 },
  { section: "teachers", key: "teacher3_image", value: "/images/teachers/default-male.png", type: "image", order: 33 },
  { section: "teachers", key: "teacher3_highlight", value: "공식보다 먼저 직관을 세워요", type: "text", order: 34 },
  { section: "teachers", key: "teacher3_careers", value: "KAIST 전기및전자공학부\n물리·수학 통합 지도\nSTEM 멘토 수상", type: "text", order: 35 },

  { section: "teachers", key: "teacher4_visible", value: "1", type: "text", order: 40 },
  { section: "teachers", key: "teacher4_subject", value: "국어", type: "text", order: 41 },
  { section: "teachers", key: "teacher4_name", value: "Teacher Jiwoo", type: "text", order: 42 },
  { section: "teachers", key: "teacher4_image", value: "/images/teachers/default-female.png", type: "image", order: 43 },
  { section: "teachers", key: "teacher4_highlight", value: "지문을 읽는 규칙을 훈련합니다", type: "text", order: 44 },
  { section: "teachers", key: "teacher4_careers", value: "서울대학교 국어국문학과\n논술 전문 프라이빗\n내신 국어 맞춤 관리", type: "text", order: 45 },

  { section: "teachers", key: "teacher5_visible", value: "0", type: "text", order: 50 },
  { section: "teachers", key: "teacher5_subject", value: "화학", type: "text", order: 51 },
  { section: "teachers", key: "teacher5_name", value: "Teacher Quinn", type: "text", order: 52 },
  { section: "teachers", key: "teacher5_image", value: "/images/teachers/default-male.png", type: "image", order: 53 },
  { section: "teachers", key: "teacher5_highlight", value: "개념 연결도를 먼저 그립니다", type: "text", order: 54 },
  { section: "teachers", key: "teacher5_careers", value: "서울대학교 화학부\n수능 화학 6년\n실험·서술형 병행", type: "text", order: 55 },

  { section: "teachers", key: "teacher6_visible", value: "0", type: "text", order: 60 },
  { section: "teachers", key: "teacher6_subject", value: "생명", type: "text", order: 61 },
  { section: "teachers", key: "teacher6_name", value: "Teacher Rachel", type: "text", order: 62 },
  { section: "teachers", key: "teacher6_image", value: "/images/teachers/default-female.png", type: "image", order: 63 },
  { section: "teachers", key: "teacher6_highlight", value: "암기를 줄이고 흐름으로 기억하게 합니다", type: "text", order: 64 },
  { section: "teachers", key: "teacher6_careers", value: "연세대학교 생화학\n수능 생명 5년\ndiagram 정리 전문", type: "text", order: 65 },

  { section: "management", key: "headline", value: "수업 밖에서도\n이어지는 학습 관리", type: "text", order: 1 },
  { section: "management", key: "subtext", value: "진도, 숙제, 질문, 리포트를 한 화면에서 연결해 학생·선생님·매니저가 같은 목표를 봅니다.", type: "text", order: 2 },
  { section: "management", key: "item1_title", value: "진도 관리", type: "text", order: 3 },
  { section: "management", key: "item1_desc", value: "주간 진도와 목표 달성률을 매니저·가정과 공유합니다.", type: "text", order: 4 },
  { section: "management", key: "item2_title", value: "질문 관리", type: "text", order: 5 },
  { section: "management", key: "item2_desc", value: "복습 질문에 대한 즉각 피드백으로 자기주도 학습을 돕습니다.", type: "text", order: 6 },
  { section: "management", key: "item3_title", value: "리포트", type: "text", order: 7 },
  { section: "management", key: "item3_desc", value: "월간 학습 데이터와 취약 유형 분석을 리포트로 제공합니다.", type: "text", order: 8 },
  { section: "management", key: "item1_visible", value: "1", type: "text", order: 9 },
  { section: "management", key: "item2_visible", value: "1", type: "text", order: 10 },
  { section: "management", key: "item3_visible", value: "1", type: "text", order: 11 },
  { section: "management", key: "item4_visible", value: "0", type: "text", order: 12 },
  { section: "management", key: "item5_visible", value: "0", type: "text", order: 13 },
  { section: "management", key: "item6_visible", value: "0", type: "text", order: 14 },
  { section: "management", key: "item4_title", value: "", type: "text", order: 15 },
  { section: "management", key: "item4_desc", value: "", type: "text", order: 16 },
  { section: "management", key: "item5_title", value: "", type: "text", order: 17 },
  { section: "management", key: "item5_desc", value: "", type: "text", order: 18 },
  { section: "management", key: "item6_title", value: "", type: "text", order: 19 },
  { section: "management", key: "item6_desc", value: "", type: "text", order: 20 },

  ...pricingPageDefaults,
  ...tutorsPageDefaults,
  ...tutorsFeaturedDefaults,
  ...tutorsBenchmarkDefaults,
  ...reviewsBenchmarkDefaults,
  ...homePageVisibilityDefaults,
  ...footerDefaults,
  ...homeLabelsDefaults,
  ...homeBenchmarkSectionsDefaults,
  ...homeSafetyStoryDefaults,
  ...compareDefaults,
  ...cmsTextStyleDefaults,
  ...spacingDefaults,
  ...extraPublicPagesDefaults,
  ...portalPagesDefaults,
];

const testimonialDefaults = [
  {
    quote: "사춘기라 잔소리하면 방 들어가버리는 아이인데, 선생님한테는 먼저 질문을 하더라고요. 3개월 만에 수학 4등급에서 2등급으로 올랐고, 무엇보다 매니저님이 중간에서 다 챙겨줘서 불안한 게 없었어요.",
    author: "고2 수학 · 학부모",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=640&h=520&fit=crop&q=80",
    order: 1,
  },
  {
    quote: "처음엔 과외가 우리 아이한테 맞을까 반신반의했어요. 그런데 매 수업 후 매니저님이 오늘 내용과 숙제를 정리해서 보내주시더라고요. 아이 상황을 직접 확인할 수 있으니 훨씬 안심됐고, 영어 내신이 두 등급이나 올랐습니다.",
    author: "중3 영어 · 학부모",
    imageUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=640&h=520&fit=crop&q=80",
    order: 2,
  },
  {
    quote: "혼자선 계속 미루던 수학 공부가, 선생님이랑 매일 플랜 점검하면서 자연스럽게 루틴이 됐어요. 3개월 만에 모의고사 수학이 69점에서 92점으로 올랐는데, 성적보다 제가 먼저 공부 습관이 바뀐 게 더 신기해요.",
    author: "고1 수학 · 학생",
    imageUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=640&h=520&fit=crop&q=80",
    order: 3,
  },
];

const faqDefaults = [
  {
    question: "상담 신청 후 얼마나 빨리 연락이 오나요?",
    answer: "상담 신청 후 보통 당일~다음날 담당 매니저가 전화드립니다. 학생의 현재 수준, 목표, 일정, 성향을 30분 내외로 확인합니다.",
    order: 1,
  },
  {
    question: "선생님 매칭은 얼마나 걸리나요?",
    answer: "상담 후 보통 1~3일 안에 후보 선생님을 추천드립니다. SKY·의치한약수 출신 중 서류·수업 시연·면접을 통과한 선생님만 배정하며, 성향이 맞지 않으면 무료로 재매칭합니다.",
    order: 2,
  },
  {
    question: "수업 중간에 선생님을 바꿀 수 있나요?",
    answer: "네, 언제든 가능합니다. 선생님께 직접 말씀하실 필요 없이 매니저에게만 말씀해 주세요. 추가 비용 없이 재매칭해 드립니다.",
    order: 3,
  },
  {
    question: "첫 수업이 마음에 안 들면 어떻게 되나요?",
    answer: "첫 수업 후 불만족 시 100% 환불해 드립니다. 어떠한 위약금이나 불이익 없이 처리됩니다.",
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
  await Promise.all(
    RESULT_CARD_IMAGES.map((image, index) =>
      prisma.siteContent.updateMany({
        where: {
          section: "results",
          key: `result${index + 1}_image`,
          value: { in: [...LEGACY_RESULT_IMAGE_PLACEHOLDERS] },
        },
        data: {
          value: image,
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

export async function upsertCmsTextDefaults() {
  const textItems = siteContentDefaults.filter(
    (item) => item.type === "text" || item.type === "number",
  );
  await Promise.all(
    textItems.map((item) =>
      prisma.siteContent.upsert({
        where: { section_key: { section: item.section, key: item.key } },
        update: { value: item.value },
        create: { ...item, updatedBy: null },
      }),
    ),
  );
  await prisma.testimonial.deleteMany({});
  await prisma.testimonial.createMany({ data: testimonialDefaults });
  await prisma.faqItem.deleteMany({});
  await prisma.faqItem.createMany({ data: faqDefaults });
}
