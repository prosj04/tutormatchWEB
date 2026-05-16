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
    <div className="min-w-0">
      <span className="text-xs font-black uppercase tracking-wider text-neutral-50">
        {label}
      </span>
      <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={
                active
                  ? "shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-black text-white shadow-sm"
                  : "shrink-0 rounded-full border border-neutral-20 bg-white px-4 py-2 text-xs font-bold text-neutral-100 transition hover:border-primary hover:text-primary"
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
      <div className="border-b border-neutral-20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">
            선생님 찾기
          </p>
          <h1 className="mt-4 font-sans text-5xl font-black tracking-[-0.04em] text-neutral-100 sm:text-7xl">
            나에게 맞는 선생님
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-neutral-50">
            마음에 드는 선생님을 찜해두세요. 매니저 상담 후 최적의 선생님을
            배정해드립니다.
          </p>

          <div className="mt-12 grid gap-5 rounded-[28px] border border-neutral-20 bg-neutral-10 p-4 md:grid-cols-2 md:p-6 lg:grid-cols-3">
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

          <div className="mt-8 flex flex-col gap-4 rounded-[28px] bg-primary p-6 text-white sm:flex-row sm:items-center sm:justify-between md:mt-10">
            <div>
              <p className="text-xl font-black">
                마음에 드는 선생님을 찜해두세요. 상담 시 매니저가 반영합니다.
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-white/80">
                상담 시 매니저에게 자동으로 공유되어 매칭에 반영됩니다. 직접
                수업 신청은 불가하며, 매니저 상담 후 배정됩니다.
              </p>
            </div>
            <Link
              href="/dashboard/consultation"
              className="shrink-0 rounded-full bg-white px-6 py-3 text-center text-sm font-black text-primary transition hover:bg-neutral-10"
            >
              무료 상담 예약하기
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-neutral-90">
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
        <p className="text-sm font-bold text-neutral-30">{filtered.length}명 표시 중</p>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {filtered.map((t) => (
            <TutorCard key={t.id} tutor={t} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="mt-16 text-center text-xl font-bold text-neutral-30">
            조건에 맞는 강사가 없습니다. 필터를 조정해 보세요.
          </p>
        )}
      </div>
      </div>
    </>
  );
}
