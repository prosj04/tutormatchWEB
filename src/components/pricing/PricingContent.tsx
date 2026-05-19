"use client";

import Link from "next/link";
import { useState } from "react";
import { getCmsSectionValue, parseMultilineList } from "@/lib/cms-page-defaults";

const PLAN_A_FALLBACK = {
  title: "월 4회",
  price: "400,000원",
  subtitle: "주 1회 · 기본 집중",
  features: [
    "주 1회 수업 (50분)",
    "학습 진도 관리",
    "과제 관리",
    "AI 질답 무제한",
    "강사 첨삭 월 4회",
  ],
  sessions: "4",
};

const PLAN_B_FALLBACK = {
  title: "월 8회",
  price: "720,000원",
  subtitle: "주 2회 · 집중 관리",
  features: [
    "주 2회 수업 (50분)",
    "주 2회 집중 관리",
    "우선 강사 배정",
    "AI 질답 무제한",
    "강사 첨삭 무제한",
    "월간 심층 리포트",
  ],
  sessions: "8",
  recommended: true,
};

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

const STAR_PATH =
  "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)";

function PunchRow() {
  return (
    <div className="absolute -bottom-3.5 left-0 flex w-full justify-around px-1">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="h-7 w-7 shrink-0 bg-neutral-10"
          style={{ clipPath: STAR_PATH }}
        />
      ))}
    </div>
  );
}

type Plan = {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  sessions: string;
  recommended?: boolean;
};

function PlanCard({ plan, visible }: { plan: Plan; visible: boolean }) {
  return (
    <article
      className={`${visible ? "block" : "hidden lg:block"} overflow-hidden rounded-[32px] bg-neutral-10`}
    >
      <div className="h-10 rounded-t-[32px] bg-neutral-10" />
      <div className="relative flex flex-col rounded-t-[32px] bg-neutral-100 pb-14 pl-8 pr-8 pt-8 text-white md:pb-16 md:pl-10 md:pr-10 md:pt-10">
        {plan.recommended ? (
          <span className="absolute right-8 top-8 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            추천
          </span>
        ) : null}
        <p className="text-xs font-black uppercase tracking-wider text-neutral-30">1:1 맞춤 과외</p>
        <h2 className="mt-5 text-3xl font-black text-white">{plan.title}</h2>
        <p className="mt-5 whitespace-nowrap text-5xl font-black tracking-tight md:text-6xl">{plan.price}</p>
        <p className="mt-3 text-sm text-neutral-40">{plan.subtitle}</p>
        <ul className="mt-8 space-y-4 text-sm font-medium leading-relaxed text-neutral-30">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-3">
              <span className="text-primary">·</span>
              {f}
            </li>
          ))}
        </ul>
        <Link
          href={`/checkout?sessions=${plan.sessions}&tutor=1`}
          className="mt-auto mt-10 inline-flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-primary/90"
        >
          이 플랜으로 시작
        </Link>
        <PunchRow />
      </div>
    </article>
  );
}

export function PricingContent({
  siteContent,
}: {
  siteContent?: Record<string, Record<string, string>>;
}) {
  const [activePlan, setActivePlan] = useState(0);
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "pricing_page", key, fallback);

  const planA: Plan = {
    title: get("plan4_title", PLAN_A_FALLBACK.title),
    price: get("plan4_price", PLAN_A_FALLBACK.price),
    subtitle: get("plan4_subtitle", PLAN_A_FALLBACK.subtitle),
    features: parseMultilineList(get("plan4_features", PLAN_A_FALLBACK.features.join("\n")), PLAN_A_FALLBACK.features),
    sessions: PLAN_A_FALLBACK.sessions,
  };

  const planB: Plan = {
    title: get("plan8_title", PLAN_B_FALLBACK.title),
    price: get("plan8_price", PLAN_B_FALLBACK.price),
    subtitle: get("plan8_subtitle", PLAN_B_FALLBACK.subtitle),
    features: parseMultilineList(get("plan8_features", PLAN_B_FALLBACK.features.join("\n")), PLAN_B_FALLBACK.features),
    sessions: PLAN_B_FALLBACK.sessions,
    recommended: true,
  };

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
        <div className="mx-auto max-w-6xl px-8">
          <p className="text-sm font-black uppercase tracking-wider text-primary">Plans</p>
          <h1 className="mt-4 whitespace-pre-line text-5xl font-black leading-tight tracking-[-0.04em] text-neutral-100 sm:text-7xl">
            {get("header_title", "1:1 맞춤 과외,\n월 40만원부터")}
          </h1>
          <p className="mt-6 max-w-2xl whitespace-pre-line text-lg font-medium leading-relaxed text-neutral-50">
            {get(
              "header_subtext",
              "가정의 일정에 맞춰 월 4회 또는 8회 패키지를 선택하세요.\n모든 플랜에 학습관리 시스템이 포함됩니다.",
            )}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-16 md:py-24">
        <div className="mb-7 grid grid-cols-2 rounded-full bg-white p-1 shadow-sm lg:hidden">
          {[planA.title, planB.title].map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setActivePlan(index)}
              className={`rounded-full py-3 text-sm font-black transition ${
                activePlan === index ? "bg-primary text-white" : "text-neutral-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <PlanCard plan={planA} visible={activePlan === 0} />
          <PlanCard plan={planB} visible={activePlan === 1} />
        </div>

        <section className="mt-24 md:mt-32">
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
    </div>
  );
}
