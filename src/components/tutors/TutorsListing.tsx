"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ConcordSubpageCta } from "@/components/concord/ConcordSubpageCta";
import { formatCmsMultiline, getCmsSectionValue, getFeaturedTutorCards } from "@/lib/cms-page-defaults";
import type { GroupedSiteContent } from "@/lib/site-content";

const SECTION = "tutors_featured";

/** 과목 필터 칩: 시안 값(all/math/eng/sci/kor) → 한글 태그 매칭 */
const FILTERS: { val: string; label: string; match: (tag: string) => boolean }[] = [
  { val: "all", label: "전체", match: () => true },
  { val: "math", label: "수학", match: (t) => t.includes("수학") },
  { val: "eng", label: "영어", match: (t) => t.includes("영어") },
  { val: "sci", label: "과학", match: (t) => /과학|물리|화학|생명|지구/.test(t) },
  { val: "kor", label: "국어", match: (t) => t.includes("국어") },
];

export function TutorsListing({
  siteContent,
}: {
  siteContent?: GroupedSiteContent;
}) {
  const [active, setActive] = useState("all");
  const cards = useMemo(() => getFeaturedTutorCards(siteContent), [siteContent]);

  const activeFilter = FILTERS.find((f) => f.val === active) ?? FILTERS[0];
  const visible = cards.filter((c) => activeFilter.match(c.tag));

  const eyebrow = getCmsSectionValue(siteContent, SECTION, "header_kicker", "Teachers");
  const title = formatCmsMultiline(
    getCmsSectionValue(siteContent, SECTION, "header_title", "검증된 명문대 출신\n전문 강사진"),
  );
  const description = getCmsSectionValue(
    siteContent,
    SECTION,
    "header_subtext",
    "모든 선생님은 학력 서류 확인과 면접을 거쳐 선발됩니다. 과목·성향·일정에 맞춰 직접 매칭해 드립니다.",
  );

  return (
    <main>
      <ConcordPageHead
        eyebrow={eyebrow}
        title={<span style={{ whiteSpace: "pre-line" }}>{title}</span>}
        description={description}
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <ConcordReveal className="filter-row" as="div" aria-label="과목 필터">
            {FILTERS.map((f) => (
              <button
                key={f.val}
                type="button"
                className={`chip-f${active === f.val ? " on" : ""}`}
                data-val={f.val}
                onClick={() => setActive(f.val)}
              >
                {f.label}
              </button>
            ))}
          </ConcordReveal>

          <div className="tutor-grid">
            {visible.map((card) => (
              <ConcordReveal key={card.index} className="card tutor-card" as="article">
                <div className="tutor-media">
                  {card.tag ? <span className="tutor-tag">{card.tag}</span> : null}
                  {card.photo ? (
                    <Image
                      src={card.photo}
                      alt={`${card.name} 선생님 프로필 사진`}
                      fill
                      className="object-cover"
                      sizes="(max-width:640px) 100vw, (max-width:960px) 50vw, 33vw"
                    />
                  ) : (
                    <span className="ph">강사 사진</span>
                  )}
                </div>
                <div className="tutor-body">
                  <div className="tutor-name">
                    {card.name} 선생님 <span className="verified">✓ 검증</span>
                  </div>
                  {card.blurb ? <p className="tutor-line">{card.blurb}</p> : null}
                  {card.university ? <div className="tutor-edu">{card.university}</div> : null}
                  {card.highlights.length > 0 ? (
                    <ul className="tutor-items">
                      {card.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </ConcordReveal>
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
