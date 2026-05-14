"use client";

import Image from "next/image";
import Link from "next/link";
import { FadeSection } from "./FadeSection";
import { showcaseTutors } from "@/lib/landing-data";

export function TutorShowcase() {
  return (
    <FadeSection>
      <section className="bg-background px-8 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-text-light">
                04 강사진
              </p>
              <h2 className="text-5xl font-black leading-tight text-text-dark sm:text-6xl">
                Tutor showcase
              </h2>
              <p className="mt-4 text-lg text-text-mid">대표 강사 라인업</p>
            </div>
            <Link
              href="/tutors"
              className="text-sm font-semibold text-primary underline-offset-4 transition hover:underline"
            >
              전체 강사 보기
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            {showcaseTutors.map((t, i) => {
              const primarySubject = t.subject.split(" · ")[0] ?? t.subject;
              return (
                <FadeSection key={t.id} delay={i * 0.06}>
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md">
                    <div className="relative aspect-[4/5] w-full">
                      <Image
                        src={t.image}
                        alt={t.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-8">
                      <p className="text-xl font-bold text-text-dark">{t.name}</p>
                      <span className="mt-3 inline-flex w-fit rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                        {primarySubject}
                      </span>
                      <span className="mt-3 inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-text-mid">
                        {t.background}
                      </span>
                      <div className="mt-4 flex items-center gap-2 text-sm text-text-mid">
                        <span className="text-primary">★</span>
                        <span className="font-semibold text-text-dark">{t.rating}</span>
                      </div>
                      <Link
                        href={`/tutors/${t.id}`}
                        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 py-3 text-xs font-semibold uppercase tracking-wider text-text-dark transition hover:border-primary hover:text-primary"
                      >
                        프로필 보기
                      </Link>
                    </div>
                  </article>
                </FadeSection>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-gray-100 pt-8 text-xs text-text-light sm:flex-row sm:items-center">
            <span className="text-text-light">04 / 06</span>
            <span className="text-text-mid">전원 프로필 검증 · 경력 서류 보관</span>
          </div>
        </div>
      </section>
    </FadeSection>
  );
}
