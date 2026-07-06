"use client";

import Image from "next/image";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ConcordSubpageCta } from "@/components/concord/ConcordSubpageCta";
import { useConsultationCta } from "@/hooks/useConsultationCta";
import {
  getCmsSectionValue,
  getFeaturedTutorCards,
  type FeaturedTutorCard,
} from "@/lib/cms-page-defaults";
import type { GroupedSiteContent } from "@/lib/site-content";

const SECTION = "tutors_featured";

function FeaturedCard({
  card,
  ctaLabel,
  onMatch,
}: {
  card: FeaturedTutorCard;
  ctaLabel: string;
  onMatch: (cardIndex: number) => void;
}) {
  return (
    <ConcordReveal as="article" className="card tutor-card">
      <div className="tutor-media" style={{ position: "relative", overflow: "hidden" }}>
        {card.tag ? <span className="tutor-tag">{card.tag}</span> : null}
        <Image
          src={card.photo}
          alt={`${card.name} 선생님 프로필 사진`}
          fill
          className="object-cover"
          sizes="(max-width:960px) 50vw, 33vw"
        />
      </div>
      <div className="tutor-body">
        <p className="tutor-name">
          {card.name} <span className="verified">✓ 검증</span>
        </p>
        <p className="tutor-line">{card.blurb}</p>
        {card.university ? <div className="tutor-edu">{card.university}</div> : null}
        {card.highlights.length > 0 ? (
          <ul className="tutor-items">
            {card.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          className="btn btn-acc btn-block tutor-match-btn"
          onClick={() => onMatch(card.index)}
        >
          {ctaLabel}
        </button>
      </div>
    </ConcordReveal>
  );
}

export function FeaturedTutors({
  siteContent,
  isEditMode = false,
}: {
  siteContent?: GroupedSiteContent;
  isEditMode?: boolean;
}) {
  const goConsultation = useConsultationCta();
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, SECTION, key, fallback);

  const cards = getFeaturedTutorCards(siteContent);
  const ctaLabel = get("cta_label", "이 선생님으로 매칭받기");
  const badges = [get("badge_1", "첫 수업 후 100% 환불"), get("badge_2", "안 맞으면 무료 교체"), get("badge_3", "서류·시연·면접 3단계 검증")].filter(Boolean);

  return (
    <main>
      <ConcordPageHead
        eyebrow={
          <CmsEdit active={isEditMode} section={SECTION} cmsKey="header_kicker" type="text">
            {get("header_kicker", "TEACHERS")}
          </CmsEdit>
        }
        title={
          <CmsEdit active={isEditMode} section={SECTION} cmsKey="header_title" type="text">
            {get("header_title", "이달의 검증 선생님")}
          </CmsEdit>
        }
        description={
          <CmsEdit active={isEditMode} section={SECTION} cmsKey="header_subtext" type="text">
            {get(
              "header_subtext",
              "지원자 절반이 탈락하는 선발을 통과한 선생님만 소개합니다. 마음에 드는 선생님으로 무료 상담을 신청하시면 매니저가 매칭을 도와드립니다.",
            )}
          </CmsEdit>
        }
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {badges.length > 0 ? (
            <ConcordReveal className="tutor-badge-row" aria-label="보장 안내">
              {badges.map((b) => (
                <span key={b} className="tutor-badge">
                  {b}
                </span>
              ))}
            </ConcordReveal>
          ) : null}

          <div className="tutor-grid">
            {cards.map((card) => (
              <FeaturedCard key={card.index} card={card} ctaLabel={ctaLabel} onMatch={(i) => void goConsultation(`tutors_featured_${i}`)} />
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
