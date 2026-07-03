"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ConcordSubpageCta } from "@/components/concord/ConcordSubpageCta";
import { formatCmsMultiline, getCmsSectionValue } from "@/lib/cms-page-defaults";
import type { GroupedSiteContent } from "@/lib/site-content";

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

const FILTER_KEYWORDS: Record<string, string[]> = {
  math: ["수학", "math"],
  eng: ["영어", "english", "eng"],
  sci: ["과학", "물리", "화학", "생물", "지구과학", "science", "physics", "chemistry", "biology"],
  kor: ["국어", "korean", "kor", "논술"],
};

function matchesFilter(tutor: TutorCardData, filter: string): boolean {
  if (filter === "all") return true;
  const keywords = FILTER_KEYWORDS[filter] ?? [];
  return tutor.subjects.some((s) =>
    keywords.some((k) => s.toLowerCase().includes(k.toLowerCase())),
  );
}

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
    <ConcordReveal as="article" className="card tutor-card" style={{ cursor: "pointer" }}>
      <Link href={`/tutors/${tutor.id}`} className="tutor-media" style={tutor.photoUrl ? { position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" } : undefined}>
        <span className="tutor-tag">{tag}</span>
        {tutor.photoUrl ? (
          <Image src={tutor.photoUrl} alt={`${tutor.name} 선생님 프로필 사진`} fill className="object-cover" sizes="(max-width:960px) 50vw, 33vw" />
        ) : (
          <span className="ph">강사 사진</span>
        )}
      </Link>
      <div className="tutor-body">
        <Link href={`/tutors/${tutor.id}`} className="tutor-name">
          {tutor.name} <span className="verified">✓ 검증</span>
        </Link>
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

export function TutorsListing({
  tutors,
  siteContent,
  isEditMode = false,
}: {
  tutors: TutorCardData[];
  siteContent?: GroupedSiteContent;
  isEditMode?: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "tutors_page", key, fallback);

  const titleLines = formatCmsMultiline(
    get("header_title", "검증된 명문대 출신\n전문 강사진"),
  )
    .split("\n")
    .filter(Boolean);

  return (
    <main>
      <ConcordPageHead
        eyebrow="Teachers"
        title={
          <CmsEdit active={isEditMode} section="tutors_page" cmsKey="header_title" type="text">
            {titleLines.length <= 1 ? (
              titleLines[0] ?? "전문 강사진"
            ) : (
              titleLines.map((line, i) => (
                <span key={line}>
                  {line}
                  {i < titleLines.length - 1 ? <br /> : null}
                </span>
              ))
            )}
          </CmsEdit>
        }
        description={
          <CmsEdit active={isEditMode} section="tutors_page" cmsKey="header_subtext" type="text">
            {get(
              "header_subtext",
              "SKY·의치한약수 출신 중 서류·수업 시연·면접을 통과한 선생님만 배정됩니다. 지원자 절반이 탈락하는 선발 과정을 거쳤습니다.",
            )}
          </CmsEdit>
        }
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
            {tutors.filter((t) => matchesFilter(t, activeFilter)).map((tutor) => (
              <ConcordTutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        </div>
      </section>

      <ConcordSubpageCta
        title="원하는 선생님, 무료 상담으로 배정받으세요"
        description="학년·과목·목표에 맞춰 매니저가 최적의 강사진을 추천해 드립니다."
        source="tutors_page_cta"
      />
    </main>
  );
}
