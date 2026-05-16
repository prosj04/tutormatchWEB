"use client";

import { FadeSection } from "./FadeSection";

const TESTIMONIALS = [
  {
    quote:
      "상담 한 번에 아이 성향을 정확히 파악하더니, 정말 딱 맞는 선생님을 연결해줬어요. 성적보다 아이가 공부를 즐기기 시작했다는 게 더 놀라웠습니다.",
    attribution: "고등학교 2학년 학부모, 수학",
  },
  {
    quote:
      "처음엔 반신반의했는데, 매니저가 꼼꼼하게 물어보고 우리 아이 스타일에 맞는 선생님을 찾아줬어요. 지금은 선생님을 정말 좋아합니다.",
    attribution: "중학교 1학년 학부모, 영어",
  },
  {
    quote:
      "단순히 과외를 구한 게 아니라, 아이 곁에 좋은 어른 한 명이 생긴 것 같아요.",
    attribution: "고등학교 1학년 학부모, 국어",
  },
] as const;

export function Testimonials() {
  return (
    <section className="bg-[#F8F8F6] px-6 py-24 md:py-28">
      <FadeSection className="mx-auto max-w-6xl">
        <h2 className="text-center font-sans text-3xl font-bold text-text-primary md:text-4xl">
          학부모님들의 이야기
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.attribution}
              className="relative rounded-2xl border-l-4 border-primary bg-white p-8 shadow-sm"
            >
              <span
                className="font-sans text-5xl leading-none text-primary/40"
                aria-hidden
              >
                &ldquo;
              </span>
              <p className="mt-2 text-sm leading-relaxed text-text-primary md:text-base">
                {t.quote}
              </p>
              <footer className="mt-6 text-xs font-medium text-text-secondary">
                — {t.attribution}
              </footer>
            </blockquote>
          ))}
        </div>
      </FadeSection>
    </section>
  );
}
