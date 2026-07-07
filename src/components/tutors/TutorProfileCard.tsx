"use client";

import Image from "next/image";

import type { FeaturedTutorCard } from "@/lib/cms-page-defaults";

/** 레퍼런스 배치 카드: 원형 사진+태그 스택 → 대학(전형) → 이름(나이) → 소개 → 과목 칩 → 경력+매칭 */
export function TutorProfileCard({
  card,
  ctaLabel,
  onMatch,
  isCenter,
}: {
  card: FeaturedTutorCard;
  ctaLabel: string;
  onMatch: (cardIndex: number) => void;
  isCenter: boolean;
}) {
  const pitch = [card.blurb, ...card.highlights].filter(Boolean).join("\n");
  return (
    <article className={`tpx-card${isCenter ? " is-center" : ""}`}>
      <div className="tpx-head">
        <div className="tpx-photo">
          <Image
            src={card.photo}
            alt={`${card.name} 선생님 프로필 사진`}
            fill
            className="object-cover"
            sizes="140px"
          />
        </div>
        {card.tags.length > 0 ? (
          <div className="tpx-tags">
            {card.tags.slice(0, 3).map((t) => (
              <span key={t} className="tpx-tag">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <p className="tpx-univ">{card.university}</p>
      <h3 className="tpx-name">
        {card.name} 선생님{card.age ? ` (${card.age}세)` : ""}
      </h3>
      <p className="tpx-pitch" style={{ whiteSpace: "pre-line" }}>{pitch}</p>
      {card.subjects.length > 0 ? (
        <div className="tpx-subjects">
          {card.subjects.slice(0, 3).map((sub) => (
            <span key={sub}>{sub}</span>
          ))}
        </div>
      ) : null}
      <div className="tpx-foot">
        <span className="tpx-career">{card.careerBadge}</span>
        <button
          type="button"
          className="tpx-cta"
          onClick={() => onMatch(card.index)}
          tabIndex={isCenter ? 0 : -1}
        >
          {ctaLabel}
        </button>
      </div>
    </article>
  );
}
