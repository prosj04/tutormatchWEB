"use client";

import Link from "next/link";
import { useState } from "react";

const faqs = [
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
    a: "가입 시 발급되는 학습 계정으로 24시간 질문이 가능하며, 강사 첨삭 횟수는 선택하신 플랜에 따라 월 4회 또는 포함 혜택이 적용됩니다.",
  },
  {
    q: "결제 수단은 무엇이 있나요?",
    a: "체크아웃 페이지에서 카드, 간편결제 등 토스페이먼츠에서 제공하는 수단을 선택하실 수 있습니다.",
  },
];

export function PricingContent() {
  const [activePlan, setActivePlan] = useState(1);

  return (
    <div className="bg-white">
      <div className="border-b border-neutral-20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-8">
          <p className="text-sm font-black uppercase tracking-wider text-primary">Plans</p>
          <h1 className="mt-4 text-5xl font-black leading-tight tracking-[-0.04em] text-neutral-100 sm:text-7xl">
            1:1 맞춤 과외,
            <br />
            월 40만원부터
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-neutral-50">
            가정의 일정에 맞춰 월 4회 또는 8회 패키지를 선택하세요. 모든 플랜에 학습관리 시스템이 포함됩니다.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-16 md:py-24">
        <div className="mb-6 grid grid-cols-2 rounded-full bg-neutral-10 p-1 md:hidden">
          {["월 4회", "월 8회"].map((label, index) => (
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
          {[
            ["월 4회", "400,000원", "주 1회 수업 (50분)", "4"],
            ["월 8회", "720,000원", "주 2회 수업 (50분)", "8"],
          ].map(([title, price, cadence, sessions], index) => (
            <article
              key={title}
              className={`${activePlan === index ? "block" : "hidden md:block"} overflow-hidden rounded-[32px] bg-neutral-20`}
            >
              <div className="h-10 bg-neutral-20" />
              <div className="relative flex min-h-[520px] flex-col rounded-t-[32px] bg-neutral-100 p-8 text-white md:p-10">
                {index === 1 ? (
                  <span className="absolute right-8 top-8 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    Recommended
                  </span>
                ) : null}
                <p className="text-xs font-black uppercase tracking-wider text-neutral-30">
                  1:1 맞춤 과외
                </p>
                <h2 className="mt-5 text-3xl font-black text-white">{title}</h2>
                <p className="mt-6 text-5xl font-black tracking-tight text-white md:text-6xl">
                  {price}
                </p>
                <ul className="mt-10 space-y-4 text-sm font-medium leading-relaxed text-neutral-30">
                  {[cadence, "학습 진도 관리", "과제 관리", "AI 질답 무제한", "강사 첨삭 포함"].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="text-primary">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/checkout?sessions=${sessions}&tutor=1`}
                  className="mt-auto inline-flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-primary/90"
                >
                  이 플랜으로 시작
                </Link>
                <div className="absolute -bottom-3 left-0 flex w-full justify-around">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span key={i} className="h-6 w-6 rounded-full bg-white" />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-24 md:mt-32">
          <h2 className="text-3xl font-black text-neutral-100 md:text-5xl">자주 묻는 질문</h2>
          <p className="mt-3 text-sm font-bold text-neutral-50">FAQ</p>
          <div className="mt-10 divide-y divide-neutral-20 overflow-hidden rounded-[28px] border border-neutral-20 bg-white">
            {faqs.map((item, i) => (
              <div key={item.q}>
                <input id={`pricing-faq-${i}`} type="checkbox" className="faq-toggle sr-only" defaultChecked={i === 0} />
                <label
                  htmlFor={`pricing-faq-${i}`}
                  className="faq-header flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-neutral-10 md:py-6"
                >
                  <span className="font-black text-neutral-100">{item.q}</span>
                  <span className="chevron-icon inline-block shrink-0 text-primary transition" aria-hidden>
                    ▼
                  </span>
                </label>
                <div className="content-wrapper grid border-t border-neutral-20 bg-neutral-10">
                  <div className="faq-content overflow-hidden">
                    <p className="px-6 py-5 text-sm font-medium leading-relaxed text-neutral-50 md:py-6">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
