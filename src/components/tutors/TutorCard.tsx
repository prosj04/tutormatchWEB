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
      <span className="ml-1.5 text-sm text-neutral-30">{value.toFixed(2)}</span>
    </span>
  );
}

export function TutorCard({ tutor: t }: TutorCardProps) {
  const degree = t.credentials.find((c) => c.category === "학력")?.title ?? "";
  const careers = t.credentials.filter((c) => c.category !== "학력").slice(0, 2);

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-neutral-80 bg-neutral-100 p-6 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="absolute right-5 top-5 z-10">
        <LikeButton tutorId={t.id} size="sm" showCount />
      </div>
      <div className="flex flex-wrap gap-2 pr-12">
        {t.subjects.slice(0, 2).map((s) => (
          <span
            key={s}
            className="rounded-full border border-neutral-80 bg-neutral-90 px-3 py-1 text-xs font-bold text-white"
          >
            {s}
          </span>
        ))}
      </div>
      <div className="mx-auto mt-8 h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent p-1">
        <div className="relative h-full w-full overflow-hidden rounded-full">
          <Image
            src={t.image}
            alt={t.name}
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col pt-8">
        <h2 className="text-2xl font-black text-white">{t.name} 선생님</h2>
        <p className="mt-3 text-lg font-black leading-snug text-white">
          {t.tagline} <span className="text-primary">전문가</span>
        </p>
        {degree ? (
          <p className="mt-4 rounded-full bg-neutral-90 px-4 py-2 text-xs font-bold text-neutral-30">
            {degree}
          </p>
        ) : null}
        <ul className="mt-6 space-y-3 text-sm font-medium leading-relaxed text-neutral-30">
          {careers.map((career) => (
            <li key={`${career.year}-${career.title}`} className="flex gap-2">
              <span className="text-primary">·</span>
              <span>{career.title}</span>
            </li>
          ))}
          <li className="flex gap-2">
            <span className="text-primary">·</span>
            <Stars value={t.rating} />
          </li>
        </ul>
        <Link
          href={`/tutors/${t.id}`}
          className="mt-auto inline-flex w-full items-center justify-center rounded-2xl border border-neutral-80 py-3.5 text-sm font-black text-white transition hover:border-primary hover:bg-primary"
        >
          프로필 보기
        </Link>
      </div>
    </article>
  );
}
