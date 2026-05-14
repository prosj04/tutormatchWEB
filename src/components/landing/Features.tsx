"use client";

import { FadeSection } from "./FadeSection";

const services = [
  {
    title: "학습 진도 관리",
    body: "주간 리포트와 목표 달성률을 가정과 공유합니다.",
    tag: "OPS",
  },
  {
    title: "AI 질답",
    body: "복습 질문에 대한 즉각 피드백으로 자기주도 학습을 돕습니다.",
    tag: "AI",
  },
  {
    title: "강사 첨삭",
    body: "과제와 모의고사에 대해 1:1 맞춤 첨삭을 제공합니다.",
    tag: "TUTOR",
  },
];

export function Features() {
  return (
    <FadeSection>
      <section className="border-t border-gray-100 bg-background px-8 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-text-light">
                05 서비스
              </p>
              <h2 className="mb-4 text-5xl font-black leading-tight text-text-dark sm:text-6xl">
                학습관리 시스템
              </h2>
              <p className="text-lg leading-relaxed text-text-mid">
                수업 외 시간까지 이어지는 학습 루프를 설계했습니다. 진도·질문·첨삭이
                한 화면에서 연결됩니다.
              </p>
            </div>
            <div className="flex flex-col gap-6">
              {services.map((s, i) => (
                <FadeSection key={s.title} delay={i * 0.06}>
                  <div className="rounded-2xl bg-white p-8 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-5xl font-black text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-text-mid">
                        {s.tag}
                      </span>
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-text-dark">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-text-mid">{s.body}</p>
                  </div>
                </FadeSection>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-gray-100 pt-8 text-xs text-text-light sm:flex-row sm:items-center">
            <span className="text-text-light">05 / 06</span>
            <span className="text-text-mid">가정·강사·매니저가 같은 데이터를 봅니다.</span>
          </div>
        </div>
      </section>
    </FadeSection>
  );
}
