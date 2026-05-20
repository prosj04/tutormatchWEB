"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";

const CARDS = [
  {
    icon: "💬",
    title: "1:1 맞춤 상담",
    body: "우리 아이의 성향과 목표를 파악합니다",
    className: "z-30 -rotate-2",
    delay: 0.2,
  },
  {
    icon: "✨",
    title: "최적의 선생님 매칭",
    body: "수백 명 중 딱 맞는 한 명",
    className: "z-20 mt-8 rotate-1 md:ml-8",
    delay: 0.4,
  },
  {
    icon: "📈",
    title: "체계적인 학습 관리",
    body: "매니저가 지속적으로 모니터링",
    className: "z-10 mt-8 -rotate-1 md:ml-16",
    delay: 0.6,
  },
] as const;

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-surface pt-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        aria-hidden
      >
        <div className="absolute -right-1/4 top-0 h-[120%] w-1 rotate-12 bg-primary md:-right-[10%]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl flex-col px-6 py-16 lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="flex-1 text-center lg:text-left"
        >
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            1:1 맞춤 과외 플랫폼
          </p>
          <h1 className="mt-6 font-sans text-4xl font-bold leading-[1.15] text-white sm:text-5xl md:text-6xl lg:text-[3.5rem]">
            학생마다 맞는
            <br />
            선생님이 다릅니다
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-gray-300 sm:text-lg lg:mx-0 lg:max-w-md">
            전문 매니저가 직접 상담하고,
            <br className="hidden sm:inline" />
            우리 아이에게 꼭 맞는 선생님을 찾아드립니다.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <ConsultationApplyButton className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-primary/90 sm:w-auto">
              무료 상담 예약하기
            </ConsultationApplyButton>
            <Link
              href="/tutors"
              className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-white/80 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              선생님 둘러보기
            </Link>
          </div>
        </motion.div>

        <div className="relative mx-auto mt-14 w-full max-w-sm flex-1 lg:mt-0 lg:max-w-md">
          {CARDS.map((card) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 40, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.55, delay: card.delay, ease: [0.22, 1, 0.36, 1] }}
              className={`relative rounded-2xl border border-white/10 bg-white/95 p-6 shadow-xl backdrop-blur ${card.className}`}
            >
              <span className="text-3xl" aria-hidden>
                {card.icon}
              </span>
              <p className="mt-3 font-sans text-xl font-bold text-text-primary">
                {card.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {card.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
