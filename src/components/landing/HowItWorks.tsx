"use client";

import { FadeSection } from "./FadeSection";

const steps = [
  {
    n: "01",
    tag: "STEP",
    title: "강사 선택",
    metric: "100%",
    metricDesc: "프로필 매칭 만족도 목표",
    desc: "프로필과 경력을 비교하며 가정에 맞는 강사를 직접 선택합니다.",
  },
  {
    n: "02",
    tag: "STEP",
    title: "플랜 결제",
    metric: "1일",
    metricDesc: "매칭 후 첫 수업까지 평균",
    desc: "수업 횟수와 기간에 맞는 요금제를 선택하고 안전하게 결제합니다.",
  },
  {
    n: "03",
    tag: "STEP",
    title: "학습 시작",
    metric: "24/7",
    metricDesc: "AI 질답 · 리포트",
    desc: "담당 매니저가 일정을 조율하고 학습 리포트로 진도를 관리합니다.",
  },
];

export function HowItWorks() {
  return (
    <FadeSection>
      <section className="bg-background px-8 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-text-mid">
              03 프로세스
            </p>
            <h2 className="mb-4 text-5xl font-black leading-tight text-text-dark sm:text-6xl">
              How it works
            </h2>
            <p className="text-lg text-text-mid">
              강사 선택 → 플랜 결제 → 학습 시작
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <FadeSection key={step.n} delay={i * 0.08}>
                <div className="rounded-2xl bg-white p-8 shadow-sm">
                  <div className="mb-6 flex items-start justify-between">
                    <span className="text-5xl font-black text-primary">{step.n}</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-text-mid">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="mb-4 text-xl font-bold text-text-dark">{step.title}</h3>
                  <p className="mb-2 text-5xl font-black text-primary">{step.metric}</p>
                  <p className="mb-6 border-b border-gray-100 pb-4 text-xs text-text-light">
                    {step.metricDesc}
                  </p>
                  <p className="text-sm leading-relaxed text-text-mid">{step.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>

          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-gray-100 pt-8 text-xs text-text-light sm:flex-row sm:items-center">
            <span>03 / 06</span>
            <span className="text-text-mid">투명한 단계별 온보딩으로 가정의 신뢰를 확보합니다.</span>
          </div>
        </div>
      </section>
    </FadeSection>
  );
}
