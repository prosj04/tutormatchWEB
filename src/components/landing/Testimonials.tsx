"use client";

import { FadeSection } from "./FadeSection";

const quotes = [
  {
    quote:
      "아이 성향에 맞는 선생님을 직접 고를 수 있어서 안심이 됐습니다. 리포트가 매주 오니 대화의 질도 달라졌어요.",
    role: "고2 · 수학 · 학부모",
  },
  {
    quote:
      "스펙만 보고 선택했는데, 수업 구성이 정말 체계적입니다. 대입 일정까지 같이 짚어 주셔서 부담이 크게 줄었습니다.",
    role: "고3 · 영어 · 학생",
  },
  {
    quote:
      "바쁜 직장 생활 속에서도 매니저분이 일정 조율을 도와주셔서 큰 힘이 됩니다. 비용 대비 만족도가 높습니다.",
    role: "중3 · 국어 · 학부모",
  },
];

export function Testimonials() {
  return (
    <FadeSection>
      <section className="bg-background px-8 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-text-mid">
              Voices
            </p>
            <h2 className="text-5xl font-black leading-tight text-text-dark sm:text-6xl">
              가정의 말씀
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {quotes.map((q, i) => (
              <FadeSection key={i} delay={i * 0.08}>
                <blockquote className="flex h-full flex-col rounded-2xl bg-white p-8 shadow-sm">
                  <p className="text-base font-medium leading-relaxed text-text-dark">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <footer className="mt-8 border-t border-gray-100 pt-6 text-xs font-medium uppercase tracking-wider text-text-light">
                    {q.role}
                  </footer>
                </blockquote>
              </FadeSection>
            ))}
          </div>

          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-gray-100 pt-8 text-xs text-text-light sm:flex-row sm:items-center">
            <span>06 / 06</span>
            <span className="text-text-mid">실명 대신 익명 표기 원칙을 준수합니다.</span>
          </div>
        </div>
      </section>
    </FadeSection>
  );
}
