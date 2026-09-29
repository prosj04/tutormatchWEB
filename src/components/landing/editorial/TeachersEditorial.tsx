"use client";

import Link from "next/link";

import { TutorProfileCard } from "@/components/tutors/TutorProfileCard";
import type { LandingView } from "./landing-view";

/** 선생님 — 인물 카드 3장(공용 TutorProfileCard) + 텍스트 링크형 전체 보기 */
export function TeachersEditorial({
  view,
  onMatch,
}: {
  view: LandingView;
  onMatch: (source: string) => void;
}) {
  const { featuredTutors, kickers, sectionTitles, uiLabels } = view;

  return (
    <section id="teachers" className="sec ruled">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow reveal lx-fast">{kickers.teachers}</span>
          <div className="sec-head-body">
            <h2 className="h2 reveal lx-slow" style={{ whiteSpace: "pre-line" }}>
              {sectionTitles.teachers}
            </h2>
            <p className="lede reveal lx-fast">{sectionTitles.teachersSubtext}</p>
          </div>
        </div>

        <div className="lx-tpx-grid">
          {featuredTutors.map((card, index) => (
            <div
              key={card.index}
              className="reveal lx-stag lx-fast"
              style={{ "--lx-i": index } as React.CSSProperties}
            >
              <TutorProfileCard
                card={card}
                ctaLabel={uiLabels.featuredCardCta}
                onMatch={(i) => onMatch(`home_featured_${i}`)}
                isCenter
              />
            </div>
          ))}
        </div>

        <p className="lx-more reveal lx-fast">
          <Link href="/tutors" className="link">
            {uiLabels.viewAllTeachers}
          </Link>
        </p>
      </div>
    </section>
  );
}
