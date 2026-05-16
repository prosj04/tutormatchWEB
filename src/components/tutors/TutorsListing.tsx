"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  tutors,
  tutorSubjectFilters,
  tutorRegionFilters,
  tutorRatingFilters,
} from "@/lib/tutors-data";
import { tutorMatchesFilters } from "@/lib/tutor-filters";
import { TutorCard } from "./TutorCard";

function FilterPills({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wider text-text-mid">
        {label}
      </span>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={
                active
                  ? "rounded-full bg-gold px-4 py-2 text-xs font-semibold text-navy shadow-sm"
                  : "rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-text-dark transition hover:border-gold/40"
              }
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TutorsListing() {
  const [subject, setSubject] = useState<string>("전체");
  const [region, setRegion] = useState<string>("전체");
  const [rating, setRating] = useState<string>("전체");

  const filtered = useMemo(
    () =>
      tutors.filter((t) =>
        tutorMatchesFilters(t, subject, region, "전체", rating),
      ),
    [subject, region, rating],
  );

  return (
    <>
      <div className="border-b border-gray-100 bg-background py-24 pt-32">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            선생님 찾기
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold text-navy sm:text-5xl">
            강사진
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-text-mid">
            마음에 드는 선생님을 찜해두세요. 매니저 상담 후 최적의 선생님을
            배정해드립니다.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FilterPills
              label="과목"
              value={subject}
              onChange={setSubject}
              options={tutorSubjectFilters}
            />
            <FilterPills
              label="지역"
              value={region}
              onChange={setRegion}
              options={tutorRegionFilters}
            />
            <FilterPills
              label="평점"
              value={rating}
              onChange={setRating}
              options={tutorRatingFilters}
            />
          </div>

          <div className="mt-10 flex flex-col gap-4 rounded-2xl border-2 border-gold/50 bg-gold/5 p-5 sm:flex-row sm:items-center sm:justify-between md:mt-12">
            <div>
              <p className="font-semibold text-navy">
                💡 마음에 드는 선생님을 찜해두세요
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text-mid">
                상담 시 매니저에게 자동으로 공유되어 매칭에 반영됩니다. 직접
                수업 신청은 불가하며, 매니저 상담 후 배정됩니다.
              </p>
            </div>
            <Link
              href="/dashboard/consultation"
              className="shrink-0 rounded-xl bg-gold px-6 py-3 text-center text-sm font-semibold text-navy transition hover:bg-gold/90"
            >
              무료 상담 예약하기
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
        <p className="text-sm text-text-light">{filtered.length}명 표시 중</p>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {filtered.map((t) => (
            <TutorCard key={t.id} tutor={t} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="mt-16 text-center text-xl font-bold text-text-light">
            조건에 맞는 강사가 없습니다. 필터를 조정해 보세요.
          </p>
        )}
      </div>
    </>
  );
}
