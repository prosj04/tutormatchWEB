/**
 * 마케팅 문구 DB 강제 업데이트
 * 실행: npx tsx scripts/update-marketing-copy.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function formatKRW(amount: number): string {
  return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`;
}

const textDefaults: { section: string; key: string; value: string }[] = [
  // ── HERO ──────────────────────────────────────────────────────
  { section: "hero", key: "headline",     value: "맞는 선생님 한 명이\n아이의 성적을 바꿉니다" },
  { section: "hero", key: "subtext",      value: "SKY·의치한약수 출신 중에서도 엄선된 선생님만 배정합니다. 전담 매니저가 성향·목표·일정을 직접 듣고 처음부터 딱 맞는 선생님을 연결해 드립니다." },
  { section: "hero", key: "cta_primary",  value: "지금 무료 상담 신청하기" },
  { section: "hero", key: "trust_text",   value: "✓ 첫 수업 100% 환불 보장 · ✓ 1~3일 내 선생님 배정" },

  // ── STATS ─────────────────────────────────────────────────────
  { section: "stats", key: "stat1_number", value: "2명 중 1명" },
  { section: "stats", key: "stat1_label",  value: "3개월 내 성적 향상" },
  { section: "stats", key: "stat2_label",  value: "누적 매칭 완료" },
  { section: "stats", key: "stat3_number", value: "97%+" },
  { section: "stats", key: "stat3_label",  value: "수강 만족도" },

  // ── TEACHERS ──────────────────────────────────────────────────
  { section: "teachers", key: "section_title",   value: "지원자 절반이 탈락하는\n검증을 통과한 선생님들" },
  { section: "teachers", key: "section_subtext", value: "SKY·의치한약수 출신만 지원 가능하며, 서류·수업 시연·최종 면접을 모두 통과한 선생님만 배정합니다." },

  // ── MANAGEMENT ────────────────────────────────────────────────
  { section: "management", key: "headline",    value: "선생님께 직접 말 못해도\n매니저가 다 챙겨드립니다" },
  { section: "management", key: "subtext",     value: "불편한 요청도 매니저가 대신 전달합니다. 학부모님은 수업 내용·숙제·성적 변화를 한 화면에서 확인하세요." },
  { section: "management", key: "item1_title", value: "수업 후 리포트" },
  { section: "management", key: "item1_desc",  value: "매 수업마다 학습 내용과 숙제를 정리해 학부모님께 전달합니다." },
  { section: "management", key: "item2_title", value: "선생님 교체도 간단하게" },
  { section: "management", key: "item2_desc",  value: "맞지 않으면 매니저에게 말씀만 해주세요. 선생님께 직접 말하지 않아도 됩니다." },
  { section: "management", key: "item3_title", value: "취약점 분석 리포트" },
  { section: "management", key: "item3_desc",  value: "월간 학습 데이터와 취약 유형을 분석해 리포트로 제공합니다." },

  // ── FEATURES (Process) ────────────────────────────────────────
  { section: "features", key: "section_subtext", value: "상담부터 배정까지 빠르면 2일, 첫 수업은 마음에 안 들면 100% 환불됩니다." },
  { section: "features", key: "step1_title",     value: "무료 상담 신청 (30초)" },
  { section: "features", key: "step1_desc",      value: "학생의 성적, 목표, 성향을 간단히 남겨주세요. 30초면 충분합니다." },
  { section: "features", key: "step2_title",     value: "당일 매니저 연락" },
  { section: "features", key: "step2_desc",      value: "전담 매니저가 1:1로 전화 상담을 진행합니다. 걱정되시는 점을 자세히 들어드립니다." },
  { section: "features", key: "step3_title",     value: "1~3일 내 선생님 추천" },
  { section: "features", key: "step3_desc",      value: "상담 내용 바탕으로 과목·성향·일정에 딱 맞는 선생님 후보를 추천합니다." },
  { section: "features", key: "step4_title",     value: "첫 수업 · 100% 환불 보장" },
  { section: "features", key: "step4_desc",      value: "첫 수업 후 불만족 시 어떠한 위약금 없이 전액 환불해 드립니다." },
  { section: "features", key: "step5_title",     value: "학습 리포트 & 지속 관리" },
  { section: "features", key: "step5_desc",      value: "진도·숙제·질문·월간 리포트를 한 흐름으로 계속 관리합니다." },

  // ── CTA ───────────────────────────────────────────────────────
  { section: "cta", key: "headline",        value: "첫 수업이 마음에 안 들면\n100% 환불해드립니다" },
  { section: "cta", key: "subtext",         value: "무료 상담 1회 · 1~3일 내 선생님 배정 · 첫 수업 100% 환불 보장" },
  { section: "cta", key: "button",          value: "지금 무료 상담 신청하기" },
  { section: "cta", key: "cta_box_2_title", value: "1~3일 내 선생님 배정" },
  { section: "cta", key: "cta_box_2_desc",  value: "상담 다음날부터 선생님 후보를 추천합니다." },
  { section: "cta", key: "cta_box_2_detail",value: "검증된 선생님 중 과목·성향·일정에 맞는 최적의 후보를 선별합니다." },
  { section: "cta", key: "cta_box_3_title", value: "첫 수업 100% 환불 보장" },
  { section: "cta", key: "cta_box_3_desc",  value: "맞지 않으면 위약금 없이 전액 환불합니다." },
  { section: "cta", key: "cta_box_3_detail",value: "첫 수업 이후 불만족 시 어떠한 조건 없이 즉시 환불 처리합니다." },
  { section: "cta", key: "cta_box_4_title", value: "매니저 직속 관리" },
  { section: "cta", key: "cta_box_4_desc",  value: "선생님·학생·학부모를 하나로 연결합니다." },
  { section: "cta", key: "cta_box_4_detail",value: "불편한 요청도 매니저가 대신 전달합니다. 수업 기록은 앱에서 바로 확인하세요." },

  // ── HOME_PAGE pricing subtext ──────────────────────────────────
  { section: "home_page", key: "pricing_subtext", value: "모든 플랜에 학습 리포트·매니저 관리·강사 첨삭이 포함됩니다. 첫 배정 선생님이 맞지 않으면 추가 비용 없이 재매칭합니다." },
];

const testimonialDefaults = [
  {
    quote: "사춘기라 잔소리하면 방 들어가버리는 아이인데, 선생님한테는 먼저 질문을 하더라고요. 3개월 만에 수학 4등급에서 2등급으로 올랐고, 무엇보다 매니저님이 중간에서 다 챙겨줘서 불안한 게 없었어요.",
    author: "고2 수학 · 학부모",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=640&h=520&fit=crop&q=80",
    order: 1,
  },
  {
    quote: "처음엔 비대면 과외가 효과 있을까 반신반의했어요. 그런데 매 수업 후 매니저님이 오늘 내용과 숙제를 정리해서 보내주시더라고요. 아이 상황을 직접 확인할 수 있으니 훨씬 안심됐고, 영어 내신이 두 등급이나 올랐습니다.",
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

async function main() {
  console.log("⏳ Upserting text defaults...");
  let updated = 0;

  for (const item of textDefaults) {
    await prisma.siteContent.upsert({
      where: { section_key: { section: item.section, key: item.key } },
      update: { value: item.value },
      create: { section: item.section, key: item.key, value: item.value, type: "text", order: 0, updatedBy: null },
    });
    updated++;
  }
  console.log(`✓ ${updated} siteContent rows upserted`);

  // Testimonials — replace all
  await prisma.testimonial.deleteMany({});
  await prisma.testimonial.createMany({ data: testimonialDefaults });
  console.log(`✓ ${testimonialDefaults.length} testimonials replaced`);

  // FAQs — replace all
  await prisma.faqItem.deleteMany({});
  await prisma.faqItem.createMany({ data: faqDefaults });
  console.log(`✓ ${faqDefaults.length} FAQs replaced`);

  // Pricing — ensure commas in price values (fix toLocaleString issue)
  const pricingRows = await prisma.siteContent.findMany({
    where: { section: "pricing_page", key: { contains: "price" } },
  });
  let pricingFixed = 0;
  for (const row of pricingRows) {
    const digits = row.value.replace(/[^\d]/g, "");
    if (!digits) continue;
    const num = Number(digits);
    if (!Number.isFinite(num) || num <= 0) continue;
    const formatted = formatKRW(num);
    if (formatted !== row.value) {
      await prisma.siteContent.update({ where: { id: row.id }, data: { value: formatted } });
      pricingFixed++;
    }
  }
  console.log(`✓ ${pricingFixed} pricing rows reformatted with commas`);

  console.log("✅ Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
