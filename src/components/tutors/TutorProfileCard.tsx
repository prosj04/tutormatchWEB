"use client";

import Image from "next/image";

import type { FeaturedTutorCard } from "@/lib/cms-page-defaults";
import { matchUnivBrand } from "@/lib/univ-brand";

/**
 * 인물 카드 v3 — 1:1 사진(원본 비율, 크롭 없음) → 학교 → 세리프 이름 → 소개
 * → 과목 텍스트 → 태그 .tag-line → 헤어라인 위 경력 캡션 + 보조형 CTA.
 * props·export 시그니처는 v2와 동일(홈·/tutors 공용).
 */
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
  const university = card.university.replace(/\s*\((수시|정시)[^)]*\)/g, "");
  const brand = matchUnivBrand(university);
  const career = card.careerBadge.startsWith("경력")
    ? card.careerBadge
    : `경력 ${card.careerBadge}`;

  return (
    <article className={`tpx-card${isCenter ? " is-center" : ""}`}>
      <figure className="tpx-photo">
        <Image
          src={card.photo}
          alt={`${card.name} 선생님 프로필 사진`}
          width={520}
          height={520}
          sizes="(max-width:960px) 78vw, 360px"
          style={{ width: "100%", height: "auto" }}
        />
      </figure>

      <div className="tpx-body">
        <p className="tpx-univ" style={brand ? { color: brand.color } : undefined}>
          {brand ? (
            <span className="tpx-univ-logo" aria-hidden="true">
              <Image src={brand.logo} alt="" fill className="object-contain" sizes="20px" />
            </span>
          ) : null}
          {university}
        </p>
        <h3 className="tpx-name">{card.name} 선생님</h3>
        <p className="tpx-pitch" style={{ whiteSpace: "pre-line" }}>
          {pitch}
        </p>
        {card.subjects.length > 0 ? (
          <p className="tpx-subjects">{card.subjects.slice(0, 3).join(" · ")}</p>
        ) : null}
        {card.tags.length > 0 ? (
          <p className="tag-line tpx-tags">
            {card.tags.slice(0, 3).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </p>
        ) : null}
      </div>

      <div className="tpx-foot">
        <span className="tpx-career">{career}</span>
        <button
          type="button"
          className="btn btn-ghost btn-sm tpx-cta"
          onClick={() => onMatch(card.index)}
          tabIndex={isCenter ? 0 : -1}
        >
          {ctaLabel}
        </button>
      </div>
    </article>
  );
}
