"use client";

import Image from "next/image";
import Link from "next/link";
import type { Tutor } from "@/lib/tutors-data";

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
      <span className="ml-1.5 text-sm text-text-mid">{value.toFixed(2)}</span>
    </span>
  );
}

export function TutorCard({ tutor: t }: TutorCardProps) {
  const hourly =
    t.hourlyMin === t.hourlyMax
      ? `시간당 ${t.hourlyMin}만원`
      : `시간당 ${t.hourlyMin}~${t.hourlyMax}만원`;
  const primarySubject = t.subjects[0] ?? "";
  const degree = t.credentials.find((c) => c.category === "학력")?.title ?? "";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[4/5] w-full">
        <Image
          src={t.image}
          alt={t.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
        />
      </div>
      <div className="flex flex-1 flex-col p-8">
        <h2 className="text-2xl font-black text-text-dark">{t.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-mid">{t.tagline}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
            {primarySubject}
          </span>
          {t.subjects.slice(1).map((s) => (
            <span
              key={s}
              className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-text-mid"
            >
              {s}
            </span>
          ))}
        </div>
        {degree ? (
          <p className="mt-3 inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-text-mid">
            {degree}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5 text-sm text-text-mid">
          <span>{hourly}</span>
          <Stars value={t.rating} />
        </div>
        <Link
          href={`/tutors/${t.id}`}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-primary/90"
        >
          프로필 보기
        </Link>
      </div>
    </article>
  );
}
