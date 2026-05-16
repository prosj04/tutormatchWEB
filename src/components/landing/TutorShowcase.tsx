"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { LikeButton } from "@/components/tutors/LikeButton";
import { FadeSection } from "./FadeSection";
import { showcaseTutors } from "@/lib/landing-data";

export function TutorShowcase() {
  return (
    <section className="bg-surface px-6 py-24 md:py-28">
      <FadeSection className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-sans text-3xl font-bold text-white md:text-4xl">
            다양한 선생님을 만나보세요
          </h2>
          <p className="mt-4 text-base text-gray-400 md:text-lg">
            마음에 드는 선생님을 찜해두면, 상담 시 매니저가 반영합니다.
          </p>
        </div>

        <div className="-mx-6 mt-12 flex gap-5 overflow-x-auto px-6 pb-4 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4 lg:gap-6">
          {showcaseTutors.map((t, i) => (
            <motion.article
              key={t.id}
              initial={{ opacity: 0, x: 48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative w-[280px] shrink-0 snap-center rounded-2xl bg-white p-6 shadow-lg md:w-auto"
            >
              <div className="absolute right-4 top-4">
                <LikeButton tutorId={t.id} size="sm" />
              </div>
              <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-gray-100">
                <Image
                  src={t.image}
                  alt={t.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <h3 className="mt-4 text-center font-sans text-xl font-bold text-text-primary">
                {t.name}
              </h3>
              <p className="mt-2 line-clamp-2 text-center text-sm text-text-secondary">
                {t.tagline}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {t.subjects.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-text-primary"
                  >
                    {s}
                  </span>
                ))}
              </div>
              {t.background ? (
                <p className="mt-3 text-center text-xs text-text-muted">
                  {t.background}
                </p>
              ) : null}
            </motion.article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/tutors"
            className="inline-flex items-center justify-center rounded-2xl border-2 border-primary px-8 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
          >
            선생님 전체 보기
          </Link>
        </div>
      </FadeSection>
    </section>
  );
}
