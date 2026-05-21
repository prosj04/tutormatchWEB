import { LandingPage } from "@/components/landing/LandingPage";
import { getLandingCmsContent } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cms = await getLandingCmsContent();
  const testimonials =
    cms.testimonials.length > 0 ? cms.testimonials : fallbackTestimonials;
  const faqs = cms.faqs.length > 0 ? cms.faqs : fallbackFaqs;

  return <LandingPage cms={{ siteContent: cms.siteContent, testimonials, faqs }} />;
}

const fallbackTestimonials = [
  {
    quote:
      "공부하러 가서도 시간만 보내던 아이가 처음으로 공부 계획을 직접 잡고 실행했어요. 무조건 아무 선생님이나 매칭하는것이 아니라 정말 아이에 맞는 선생님을 고민하고 찾아주셔서 훨씬 안심됐습니다.",
    info: "고2 수학 · 학부모",
    img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=640&h=520&fit=crop&q=80",
  },
  {
    quote:
      "공부 잘 하는 선생님보다도 방황하는 아들의 방향을 잡아 줄 만한 선생님이 필요했는데, 정확히 맞는 선생님을 찾아줬어요.\n무엇보다 아이가 과외쌤처럼 되고 싶다며 열심히 하려고 하는 모습이 보여 정말 만족합니다",
    info: "고3 수학 · 학부모",
    img: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=640&h=520&fit=crop&q=80",
  },
  {
    quote:
      "숙제와 공부 계획을 등록하고 선생님이랑 같이 점검하니 자연스럽게 매일 공부하게 되더라구요. 성적보다 습관이 먼저 바뀌었어요.",
    info: "중3 영어 · 학생",
    img: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=640&h=520&fit=crop&q=80",
  },
];

const fallbackFaqs = [
  {
    q: "상담은 어떻게 진행되나요?",
    a: "상담 신청 후 담당 매니저가 전화로 학생의 현재 수준, 목표, 일정, 성향을 확인합니다.",
  },
  {
    q: "선생님 매칭은 얼마나 걸리나요?",
    a: "상담 후 보통 1~3일 안에 후보 선생님을 추천드리며, 일정 조율 후 수업을 시작합니다.",
  },
  {
    q: "수업 중간에 선생님을 바꿀 수 있나요?",
    a: "첫 수업 이후 적합도가 맞지 않으면 매니저와 상의해 다른 선생님으로 조정할 수 있습니다.",
  },
  {
    q: "환불 정책이 어떻게 되나요?",
    a: "개강 전 취소는 전액 환불되며, 개강 후에는 이용한 수업 횟수를 제외하고 정산합니다.",
  },
];
