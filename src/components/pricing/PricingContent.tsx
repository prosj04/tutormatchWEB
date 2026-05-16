"use client";

import Link from "next/link";
import { useState } from "react";
import { formatKRW } from "@/lib/format-won";

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
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="pb-24 md:pb-32">
      <div className="border-b border-gray-100 bg-background py-24">
        <div className="mx-auto max-w-6xl px-8">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Plans</p>
          <h1 className="mt-4 text-5xl font-black leading-tight text-text-primary sm:text-6xl">요금제</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
            가정의 일정에 맞춰 월 4회 또는 8회 패키지를 선택하세요. 모든 플랜에 학습관리 시스템이 포함됩니다.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-16 md:py-24">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <article className="flex flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:p-10">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Plan A</p>
            <h2 className="mt-4 text-2xl font-black text-text-primary md:text-3xl">월 4회</h2>
            <p className="mt-4 text-4xl font-black tracking-tight text-primary md:text-5xl">
              {formatKRW(400_000)}
            </p>
            <ul className="mt-10 space-y-4 text-sm leading-relaxed text-text-secondary">
              <li className="flex gap-3">
                <span className="text-primary">·</span>
                주 1회 수업 (50분)
              </li>
              <li className="flex gap-3">
                <span className="text-primary">·</span>
                학습 진도 관리
              </li>
              <li className="flex gap-3">
                <span className="text-primary">·</span>
                과제 관리
              </li>
              <li className="flex gap-3">
                <span className="text-primary">·</span>
                AI 질답 무제한
              </li>
              <li className="flex gap-3">
                <span className="text-primary">·</span>
                강사 첨삭 월 4회
              </li>
            </ul>
            <Link
              href="/checkout?sessions=4&tutor=1"
              className="mt-10 inline-flex w-full items-center justify-center rounded-2xl border border-gray-300 py-4 text-sm font-semibold uppercase tracking-wider text-text-primary transition hover:bg-gray-50"
            >
              이 플랜으로 시작
            </Link>
          </article>

          <article className="relative flex flex-col rounded-2xl border-2 border-primary bg-white p-8 shadow-md md:p-10">
            <span className="absolute right-8 top-8 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Recommended
            </span>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Plan B</p>
            <h2 className="mt-4 text-2xl font-black text-text-primary md:text-3xl">월 8회</h2>
            <p className="mt-4 text-4xl font-black tracking-tight text-primary md:text-5xl">
              {formatKRW(720_000)}
            </p>
            <ul className="mt-10 space-y-4 text-sm leading-relaxed text-text-secondary">
              <li className="flex gap-3">
                <span className="text-primary">·</span>
                주 2회 수업 (50분)
              </li>
              <li className="flex gap-3">
                <span className="text-primary">·</span>
                위 혜택 모두 포함
              </li>
              <li className="flex gap-3">
                <span className="text-primary">·</span>
                우선 강사 배정
              </li>
            </ul>
            <Link
              href="/checkout?sessions=8&tutor=1"
              className="mt-10 inline-flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-primary/90"
            >
              이 플랜으로 시작
            </Link>
          </article>
        </div>

        <section className="mt-24 md:mt-32">
          <h2 className="text-3xl font-black text-text-primary md:text-4xl">자주 묻는 질문</h2>
          <p className="mt-3 text-sm text-text-muted">FAQ</p>
          <div className="mt-10 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {faqs.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-gray-50 md:py-6"
                  >
                    <span className="font-semibold text-text-primary">{item.q}</span>
                    <span
                      className={`inline-block shrink-0 text-primary transition ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      ▼
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-gray-100 bg-background px-6 py-5 text-sm leading-relaxed text-text-secondary md:py-6">
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
