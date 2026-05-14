"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { heroSampleTutor } from "@/lib/landing-data";

export function Hero() {
  const t = heroSampleTutor;

  return (
    <section className="relative min-h-[100dvh] bg-background pt-16">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl flex-col px-8 py-24">
        <div className="grid flex-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-text-light">
                01 메인
              </p>
              <h1 className="mb-4 text-5xl font-black leading-tight tracking-tight text-text-dark sm:text-6xl">
                검증된 선생님,
                <br />
                체계적인 학습관리
              </h1>
              <p className="text-lg text-text-mid">
                최상위 강사진과 1:1 맞춤 수업을 경험하세요
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <Link
                href="/tutors"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
              >
                강사 둘러보기
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-2xl border border-gray-300 px-8 py-4 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-white"
              >
                수업 상담하기
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none"
          >
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex gap-5">
                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl sm:h-32 sm:w-28">
                  <Image
                    src={t.image}
                    alt={`${t.name} 프로필 사진`}
                    fill
                    className="object-cover"
                    sizes="112px"
                    priority
                  />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-mid">
                    Featured tutor
                  </p>
                  <p className="mt-2 text-2xl font-black text-text-dark">{t.name}</p>
                  <span className="mt-2 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                    {t.subject.split(" · ")[0] ?? t.subject}
                  </span>
                  <p className="mt-3 text-xs leading-relaxed text-text-light">
                    {t.background}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-text-mid">
                    <span className="text-primary">★</span>
                    <span className="font-semibold text-text-dark">{t.rating}</span>
                    <span className="text-text-light">·</span>
                    <span className="text-text-light">응답률 상위 5%</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 border-t border-gray-100 pt-6">
                <p className="text-xs uppercase tracking-wider text-text-light">
                  Next availability
                </p>
                <p className="mt-2 text-lg font-bold text-text-dark">이번 주 화 · 목 저녁</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-gray-100 pt-8 text-xs text-text-light sm:flex-row sm:items-center">
          <span className="text-text-light">01 / 06</span>
          <span className="text-text-mid">검증 강사 · 맞춤 일정 · 학습 리포트</span>
        </div>
      </div>
    </section>
  );
}
