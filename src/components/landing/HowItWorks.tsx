"use client";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { FadeSection } from "./FadeSection";

const STEPS = [
  {
    num: "01",
    title: "무료 상담 예약",
    body: "매니저와 1:1 상담을 예약합니다.\n아이의 성향, 목표, 학습 스타일을 파악합니다.",
  },
  {
    num: "02",
    title: "맞춤 선생님 매칭",
    body: "상담 내용을 바탕으로 매니저가\n직접 최적의 선생님을 선별합니다.",
  },
  {
    num: "03",
    title: "학습 시작 & 관리",
    body: "수업 시작 후에도 매니저가\n진도와 만족도를 지속적으로 관리합니다.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="bg-white px-6 py-24 md:py-28">
      <FadeSection className="mx-auto max-w-6xl text-center">
        <h2 className="font-sans text-3xl font-bold text-text-primary md:text-4xl">
          이렇게 진행됩니다
        </h2>

        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative flex flex-col items-center">
              {i < STEPS.length - 1 ? (
                <span
                  className="absolute right-0 top-8 hidden translate-x-1/2 text-2xl text-primary/50 md:block"
                  aria-hidden
                >
                  →
                </span>
              ) : null}
              <p className="font-sans text-6xl font-bold text-primary md:text-7xl">
                {step.num}
              </p>
              <h3 className="mt-4 font-sans text-xl font-bold text-text-primary">
                {step.title}
              </h3>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-text-secondary md:text-base">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        <ConsultationApplyButton className="mt-14 inline-flex items-center justify-center rounded-2xl bg-primary px-10 py-4 text-base font-semibold text-white transition hover:bg-primary/90">
          지금 바로 시작하기
        </ConsultationApplyButton>
      </FadeSection>
    </section>
  );
}
