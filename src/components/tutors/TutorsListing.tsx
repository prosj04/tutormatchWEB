"use client";

import { useMemo, useState } from "react";
import {
  tutors,
  tutorSubjectFilters,
  tutorRegionFilters,
  tutorPriceFilters,
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
                  ? "rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm"
                  : "rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-text-dark transition hover:border-gray-300"
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
  const [price, setPrice] = useState<string>("전체");
  const [rating, setRating] = useState<string>("전체");

  const filtered = useMemo(
    () => tutors.filter((t) => tutorMatchesFilters(t, subject, region, price, rating)),
    [subject, region, price, rating],
  );

  return (
    <>
      <div className="border-b border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-8">
          <p className="text-xs font-medium uppercase tracking-wider text-text-mid">
            Directory
          </p>
          <h1 className="mt-3 text-4xl font-black text-text-dark md:text-5xl">강사진</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-mid">
            과목 · 지역 · 예산에 맞춰 검증된 강사를 찾아보세요.
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
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
              label="가격대"
              value={price}
              onChange={setPrice}
              options={tutorPriceFilters}
            />
            <FilterPills
              label="평점"
              value={rating}
              onChange={setRating}
              options={tutorRatingFilters}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-16 md:py-20">
        <p className="text-sm text-text-light">{filtered.length}명 표시 중</p>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
