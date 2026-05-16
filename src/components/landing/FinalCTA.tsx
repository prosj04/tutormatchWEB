"use client";

import Link from "next/link";

import { FadeSection } from "./FadeSection";

export function FinalCTA() {
  return (
    <section className="bg-surface px-6 py-24 md:py-32">
      <FadeSection className="mx-auto max-w-2xl text-center">
        <h2 className="font-sans text-3xl font-bold leading-snug text-white md:text-4xl lg:text-5xl">
          우리 아이에게 맞는 선생님,
          <br />
          지금 찾아드리겠습니다.
        </h2>
        <p className="mt-6 text-base text-gray-400 md:text-lg">
          무료 상담 예약 후 매칭까지 평균 3일
        </p>
        <Link
          href="/dashboard/consultation"
          className="mt-10 inline-flex items-center justify-center rounded-2xl bg-primary px-12 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-primary/90"
        >
          무료 상담 예약하기
        </Link>
      </FadeSection>
    </section>
  );
}
