import type { Metadata } from "next";

import { LandingRoot } from "@/components/landing/LandingRoot";
import { PublicShell } from "@/components/layout/PublicShell";
import { startPerfTimer } from "@/lib/perf-timer";
import { getLandingCmsContent } from "@/lib/cms";
import { SITE_URL } from "@/lib/site-config";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "프리미엄 1:1 과외 | 명문대 검증 강사 매칭",
  description:
    "엄선된 명문대 출신 선생님과 1:1 맞춤 과외. 상담부터 매칭·수업·학습 관리까지 전담 매니저가 함께합니다.",
  openGraph: {
    title: "프리미엄 1:1 과외 | Concord Private Tutoring",
    description:
      "엄선된 명문대 출신 선생님과 1:1 맞춤 과외. 상담부터 매칭·수업·학습 관리까지 전담 매니저가 함께합니다.",
    url: SITE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Concord Private Tutoring" }],
  },
};

type SearchParams = { cms_edit?: string | string[] };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function HomePage(
  props: {
    searchParams?: Promise<SearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const timer = startPerfTimer("page.home.total");
  const isEditMode = first(searchParams?.cms_edit) === "1";
  const cms = await getLandingCmsContent();
  const testimonials =
    cms.testimonials.length > 0 ? cms.testimonials : fallbackTestimonials;
  const faqs = cms.faqs.length > 0 ? cms.faqs : fallbackFaqs;

  const page = (
    <PublicShell showCompareLink>
      <LandingRoot
        cms={{ siteContent: cms.siteContent, testimonials, faqs }}
        isEditMode={isEditMode}
      />
    </PublicShell>
  );

  timer.end();
  return page;
}

const fallbackTestimonials = [
  {
    quote:
      "사춘기라 잔소리하면 방 들어가버리는 아이인데, 선생님한테는 먼저 질문을 하더라고요. 3개월 만에 수학 4등급에서 2등급으로 올랐고, 무엇보다 매니저님이 중간에서 다 챙겨줘서 불안한 게 없었어요.",
    info: "고2 수학 · 학부모",
    img: "/images/photos/selfies/selfie-1.jpg",
  },
  {
    quote:
      "과외가 우리 아이한테 맞을까 반신반의했습니다. 매 수업 후 진도와 숙제 정리가 도착하니 상황을 직접 확인할 수 있었고, 영어 내신이 두 등급 올랐습니다.",
    info: "중3 영어 · 학부모",
    img: "/images/photos/selfies/selfie-2.jpg",
  },
  {
    quote:
      "혼자선 계속 미루던 수학이 매일 플랜 점검하면서 그냥 루틴이 됐어요. 69점에서 92점.. 성적보다 습관 바뀐 게 더 신기해요.",
    info: "고1 수학 · 학생",
    img: "/images/photos/selfies/selfie-2.jpg",
  },
];

const fallbackFaqs = [
  {
    q: "상담 신청 후 얼마나 빨리 연락이 오나요?",
    a: "상담 신청 후 보통 당일~다음날 담당 매니저가 전화드립니다. 학생의 현재 수준, 목표, 일정, 성향을 30분 내외로 확인합니다.",
  },
  {
    q: "선생님 매칭은 얼마나 걸리나요?",
    a: "상담 후 보통 1~3일 안에 후보 선생님을 추천드립니다. SKY·의치한약수 출신 중 서류·수업 시연·면접을 통과한 선생님만 배정하며, 성향이 맞지 않으면 무료로 재매칭합니다.",
  },
  {
    q: "수업 중간에 선생님을 바꿀 수 있나요?",
    a: "네, 언제든 가능합니다. 선생님께 직접 말씀하실 필요 없이 매니저에게만 말씀해 주세요. 추가 비용 없이 재매칭해 드립니다.",
  },
  {
    q: "첫 수업이 마음에 안 들면 어떻게 되나요?",
    a: "첫 수업 후 불만족 시 100% 환불해 드립니다. 어떠한 위약금이나 불이익 없이 처리됩니다.",
  },
];
