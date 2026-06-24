"use client";

import Image from "next/image";
import { useState } from "react";

import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordReveal } from "@/components/concord/ConcordReveal";

export type TutorCardData = {
  id: string;
  name: string;
  subjects: string[];
  bio?: string | null;
  education?: string | null;
  experience?: string | null;
  photoUrl?: string | null;
};

const FILTERS = [
  { val: "all", label: "전체" },
  { val: "math", label: "수학" },
  { val: "eng", label: "영어" },
  { val: "sci", label: "과학" },
  { val: "kor", label: "국어" },
] as const;

function splitBullets(value?: string | null): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[\n,|/]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
}

function ConcordTutorCard({ tutor }: { tutor: TutorCardData }) {
  const tag = tutor.subjects[0] ?? "과목";
  const items = splitBullets(tutor.experience);

  return (
    <ConcordReveal as="article" className="card tutor-card">
      <div className="tutor-media" style={tutor.photoUrl ? { position: "relative", overflow: "hidden" } : undefined}>
        <span className="tutor-tag">{tag}</span>
        {tutor.photoUrl ? (
          <Image src={tutor.photoUrl} alt="" fill className="object-cover" sizes="(max-width:960px) 50vw, 33vw" />
        ) : (
          <span className="ph">강사 사진</span>
        )}
      </div>
      <div className="tutor-body">
        <div className="tutor-name">
          {tutor.name} <span className="verified">✓ 검증</span>
        </div>
        <p className="tutor-line">{tutor.bio ?? ""}</p>
        <div className="tutor-edu">{tutor.education ?? ""}</div>
        {items.length > 0 ? (
          <ul className="tutor-items">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </ConcordReveal>
  );
}

export function TutorsListing({ tutors }: { tutors: TutorCardData[] }) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  return (
    <main>
      <ConcordPageHead
        eyebrow="Teachers"
        title={
          <>
            검증된 명문대 출신
            <br />
            전문 강사진
          </>
        }
        description="모든 선생님은 학력 서류 확인과 면접을 거쳐 선발됩니다. 과목·성향·일정에 맞춰 직접 매칭해 드립니다."
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <ConcordReveal className="filter-row" data-group aria-label="과목 필터">
            {FILTERS.map((f) => (
              <button
                key={f.val}
                type="button"
                className={`chip-f${activeFilter === f.val ? " on" : ""}`}
                data-val={f.val}
                onClick={() => setActiveFilter(f.val)}
              >
                {f.label}
              </button>
            ))}
          </ConcordReveal>

          <div className="tutor-grid">
            {tutors.map((tutor) => (
              <ConcordTutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
