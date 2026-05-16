"use client";

import { AnimatedCounter } from "./AnimatedCounter";
import { FadeSection } from "./FadeSection";

const STATS = [
  { value: "500+", label: "등록 선생님" },
  { value: "98%", label: "학생 만족도" },
  { value: "1,200+", label: "누적 매칭" },
] as const;

export function TrustBar() {
  return (
    <section className="bg-white px-6 py-20 md:py-24">
      <FadeSection className="mx-auto max-w-4xl">
        <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <AnimatedCounter
                value={s.value}
                className="block font-sans text-5xl font-bold text-primary md:text-6xl"
              />
              <p className="mt-3 text-sm font-medium text-text-secondary">{s.label}</p>
            </div>
          ))}
        </div>
      </FadeSection>
    </section>
  );
}
