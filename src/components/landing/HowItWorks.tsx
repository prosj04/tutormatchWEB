"use client";

import { FadeSection } from "./FadeSection";

const steps = [
  {
    n: "01",
    title: "강사 선택",
    desc: "프로필과 경력을 비교하며 가정에 맞는 강사를 직접 선택합니다.",
  },
  {
    n: "02",
    title: "플랜 결제",
    desc: "수업 횟수와 기간에 맞는 요금제를 선택하고 안전하게 결제합니다.",
  },
  {
    n: "03",
    title: "학습 시작",
    desc: "담당 매니저가 일정을 조율하고 학습 리포트로 진도를 관리합니다.",
  },
];

export function HowItWorks() {
  return (
    <FadeSection>
      <section className="bg-ivory py-24 md:py-32">
        <div className="mx-auto max-w-content px-5 sm:px-8 md:px-12 lg:px-16">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            Process
          </p>
          <h2 className="mt-4 text-center font-serif text-3xl text-navy md:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-navy/65">
            강사 선택 → 플랜 결제 → 학습 시작
          </p>

          <div className="mt-20 grid gap-14 md:grid-cols-3 md:gap-10 lg:mt-24">
            {steps.map((step, i) => (
              <FadeSection key={step.n} delay={i * 0.08} className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold/80 font-serif text-2xl text-gold">
                  {step.n}
                </div>
                <h3 className="mt-8 font-serif text-xl text-navy">{step.title}</h3>
                <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-navy/60">
                  {step.desc}
                </p>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>
    </FadeSection>
  );
}
