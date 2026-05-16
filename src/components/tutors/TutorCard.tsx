"use client";

import Image from "next/image";
import Link from "next/link";

import type { Tutor } from "@/lib/tutors-data";
import { LikeButton } from "./LikeButton";

type TutorCardProps = {
  tutor: Tutor;
};

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5 text-primary" aria-label={`평점 ${value}`}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={i}>★</span>
      ))}
      {half && <span className="text-primary/40">★</span>}
      <span className="ml-1.5 text-sm text-text-secondary">{value.toFixed(2)}</span>
    </span>
  );
}

export function TutorCard({ tutor: t }: TutorCardProps) {
  const degree = t.credentials.find((c) => c.category === "학력")?.title ?? "";

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md">
      <div className="absolute right-3 top-3 z-10">
        <LikeButton tutorId={t.id} size="sm" showCount />
      </div>
      <div className="relative aspect-[4/5] w-full">
        <Image
          src={t.image}
          alt={t.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
        />
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <h2 className="text-2xl font-black text-text-primary">{t.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t.tagline}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {t.subjects.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-text-primary"
            >
              {s}
            </span>
          ))}
        </div>
        {degree ? (
          <p className="mt-3 text-xs text-text-secondary">{degree}</p>
        ) : null}
        <div className="mt-5 border-t border-gray-100 pt-5">
          <Stars value={t.rating} />
        </div>
        <Link
          href={`/tutors/${t.id}`}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border-2 border-text-primary py-3.5 text-sm font-semibold text-text-primary transition hover:bg-surface hover:text-white"
        >
          프로필 보기
        </Link>
      </div>
    </article>
  );
}
