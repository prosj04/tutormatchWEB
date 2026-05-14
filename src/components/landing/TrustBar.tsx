"use client";

import { FadeSection } from "./FadeSection";

const stats = [
  { label: "검증 강사", value: "180+", hint: "+12% YoY" },
  { label: "누적 수업", value: "12,400+", hint: "+8.2% YoY" },
  { label: "학생 만족도", value: "98%", hint: "+0.4% YoY" },
];

export function TrustBar() {
  return (
    <FadeSection>
      <section className="bg-background px-8 py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-white p-8 shadow-sm"
            >
              <p className="mb-3 text-xs text-text-light">{s.label}</p>
              <p className="text-6xl font-black text-primary">{s.value}</p>
              <p className="mt-1 text-sm font-semibold text-primary">{s.hint}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 flex max-w-6xl flex-col justify-between gap-4 border-t border-gray-100 pt-8 text-xs text-text-light sm:flex-row sm:items-center">
          <span>02 / 06</span>
          <span className="text-text-mid">운영 지표는 분기별로 갱신됩니다.</span>
        </div>
      </section>
    </FadeSection>
  );
}
