"use client";

import { PricingPlanCard } from "@/components/pricing/PricingPlanCard";
import { FloatingConsultationCue } from "@/components/pricing/FloatingConsultationCue";
import { getCmsSectionValue, parseMultilineList } from "@/lib/cms-page-defaults";
import { formatPlanPrice, PRICING_PLANS } from "@/lib/pricing-plans";

const FAQ_FALLBACK = [
  {
    q: "수업 시간과 환불 규정은 어떻게 되나요?",
    a: "1회 수업은 50분 기준이며, 개강 전 결제 취소는 전액 환불됩니다. 개강 후에는 잔여 횟수에 비례하여 산정되며, 세부 약관은 계약서에 명시됩니다.",
  },
  {
    q: "강사 변경이 가능한가요?",
    a: "첫 2회 수업 이내에만 동일 요금제 범위에서 1회에 한해 변경이 가능합니다. 이후에는 매니저와 별도 협의가 필요합니다.",
  },
  {
    q: "AI 질답은 어떻게 이용하나요?",
    a: "가입 시 발급되는 학습 계정으로 24시간 질문이 가능하며, 강사 첨삭 횟수는 선택하신 플랜에 따라 월 4회 또는 무제한 혜택이 적용됩니다.",
  },
  {
    q: "결제 수단은 무엇이 있나요?",
    a: "체크아웃 페이지에서 카드, 간편결제 등 토스페이먼츠에서 제공하는 수단을 선택하실 수 있습니다.",
  },
];

export function PricingContent({
  siteContent,
}: {
  siteContent?: Record<string, Record<string, string>>;
}) {
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "pricing_page", key, fallback);

  const cmsPlanOverrides: Partial<
    Record<string, { title?: string; subtitle?: string; features?: string[] }>
  > = {
    "4-1": {
      title: get("plan4_title", "월 4회"),
      subtitle: get("plan4_subtitle", "1과목 · 주 1회"),
      features: parseMultilineList(
        get(
          "plan4_features",
          "주 1회 수업 (50분)\n학습 진도 관리\n과제 관리\nAI 질답 무제한\n강사 첨삭 월 4회",
        ),
        PRICING_PLANS[0].features,
      ),
    },
    "8-1": {
      title: get("plan8_title", "월 8회"),
      subtitle: get("plan8_subtitle", "1과목 · 주 2회"),
      features: parseMultilineList(
        get(
          "plan8_features",
          "주 2회 수업 (50분)\n주 2회 집중 관리\n우선 강사 배정\nAI 질답 무제한\n강사 첨삭 무제한\n월간 심층 리포트",
        ),
        PRICING_PLANS[1].features,
      ),
    },
  };

  const plans = PRICING_PLANS.map((plan) => {
    const override = cmsPlanOverrides[plan.id];
    const cmsPrice =
      plan.id === "4-1"
        ? get("plan4_price", "")
        : plan.id === "8-1"
          ? get("plan8_price", "")
          : "";
    return {
      plan,
      title: override?.title ?? plan.title,
      subtitle: override?.subtitle ?? plan.subtitle,
      features: override?.features ?? plan.features,
      price:
        cmsPrice && (plan.id === "4-1" || plan.id === "8-1")
          ? cmsPrice
          : formatPlanPrice(plan.sessions, plan.subjects),
    };
  });

  const faqs = FAQ_FALLBACK.map((item, index) => {
    const n = index + 1;
    return {
      q: get(`faq${n}_q`, item.q),
      a: get(`faq${n}_a`, item.a),
    };
  });

  return (
    <div className="bg-neutral-10 pb-24 md:pb-32">
      <div className="border-b border-neutral-20 bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-5">
          <p className="text-sm font-black uppercase tracking-wider text-primary">Plans</p>
          <h1 className="mt-4 whitespace-pre-line text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-[-0.04em] text-neutral-100">
            {get("header_title", "1:1 맞춤 과외,\n월 40만원부터")}
          </h1>
          <p className="mt-6 max-w-2xl whitespace-pre-line text-base font-medium leading-relaxed text-neutral-50 md:text-lg">
            {get(
              "header_subtext",
              "주 1회 회당 10만원, 주 2회 이상 회당 9만원입니다.\n1과목·2과목(선생님 2명) 패키지를 선택하세요.",
            )}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-5 py-16 md:py-24">
        <p className="mb-8 text-center text-sm font-bold text-neutral-50">
          주 1회(월 4회) · 회당 10만원 / 주 2회 이상(월 8회) · 회당 9만원
        </p>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((item) => (
            <PricingPlanCard
              key={item.plan.id}
              plan={item.plan}
              title={item.title}
              subtitle={item.subtitle}
              price={item.price}
              features={item.features}
              active
            />
          ))}
        </div>

        <FloatingConsultationCue className="py-10 md:py-14" />
      </div>

      <section className="mx-auto max-w-[1200px] px-5 pb-16 md:pb-24">
        <h2 className="text-3xl font-black text-neutral-100 md:text-5xl">
          {get("faq_title", "자주 묻는 질문")}
        </h2>
        <p className="mt-2 text-sm font-bold text-neutral-50">FAQ</p>
        <div className="mt-10 divide-y divide-neutral-20 overflow-hidden rounded-[28px] border border-neutral-20 bg-white">
          {faqs.map((item) => (
            <div key={item.q} className="px-7 py-7 md:px-8 md:py-8">
              <p className="font-black text-neutral-100 md:text-lg">Q. {item.q}</p>
              <p className="mt-4 text-sm font-medium leading-relaxed text-neutral-50 md:text-base">
                A. {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
