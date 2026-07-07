"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { CountUpStat } from "@/components/common/CountUpStat";
import { HallOfFameCarousel, type HallItem } from "@/components/common/HallOfFameCarousel";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ConcordSubpageCta } from "@/components/concord/ConcordSubpageCta";
import { formatCmsMultiline, getCmsSectionValue, parseCmsVisibility } from "@/lib/cms-page-defaults";
import {
  REVIEW_CATEGORIES,
  ReviewByLine,
  type ReviewCardItem,
} from "@/lib/reviews-html-fallback";
import type { GroupedSiteContent } from "@/lib/site-content";

function multilineNodes(text: string) {
  const lines = formatCmsMultiline(text).split("\n").filter(Boolean);
  if (lines.length <= 1) return text;
  return lines.map((line, i) => (
    <span key={`${i}-${line}`}>
      {line}
      {i < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

function splitTags(raw: string): string[] {
  return raw
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
}

type SuccessCard = {
  n: number;
  from: string;
  to: string;
  result: string;
  student: string;
  tags: string[];
};

type ProofCard = {
  n: number;
  image: string;
  student: string;
  comment: string;
};

const SUCCESS_DEFAULTS: Array<Omit<SuccessCard, "n">> = [
  { from: "3등급", to: "1등급", result: "고1 화학 내신, 3개월", student: "일반고, 김*아 학생", tags: ["#화학", "#내신", "#성적급상승"] },
  { from: "4등급", to: "2등급", result: "고3 국어 모의고사, 6개월", student: "일반고, 이*준 학생", tags: ["#국어", "#모의고사", "#독해훈련"] },
  { from: "64점", to: "87점", result: "중3 영어 학교시험, 4개월", student: "일반중, 박*서 학생", tags: ["#영어", "#기초부터"] },
  { from: "5등급", to: "2등급", result: "고2 수학 내신, 3개월", student: "일반고, 정*원 학생", tags: ["#수학", "#내신"] },
  { from: "55점", to: "78점", result: "고1 국어 내신, 3개월", student: "일반고, 한*빈 학생", tags: ["#국어", "#공부습관"] },
];

const PROOF_DEFAULTS: Array<Omit<ProofCard, "n">> = [
  {
    image: "/images/placeholders/review-proof-1.png",
    student: "고1 화학 | 2025년 수강",
    comment: "막히는 단원을 정확히 찾아주니 3개월 만에 내신이 달라졌어요",
  },
  {
    image: "/images/placeholders/review-proof-2.png",
    student: "고3 국어 | 2025년 수강",
    comment: "지문 읽는 방법부터 훈련하니 모의고사가 안정적으로 올랐어요",
  },
  {
    image: "/images/placeholders/review-proof-3.png",
    student: "중3 영어 | 2026년 수강",
    comment: "기초부터 다시 잡아주셔서 시험이 두렵지 않게 됐어요",
  },
];

export function ReviewsPageContent({
  testimonials,
  siteContent,
  isEditMode = false,
}: {
  testimonials: ReviewCardItem[];
  siteContent?: GroupedSiteContent;
  isEditMode?: boolean;
}) {
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "reviews_page", key, fallback);
  const getSuccess = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "reviews_success", key, fallback);
  const getProof = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "reviews_proof", key, fallback);

  const [activeCategory, setActiveCategory] = useState<string>("전체");

  const hallItems: HallItem[] = useMemo(() => {
    const HALL_FALLBACK: [string, string][] = [
      ["연세대학교 합격", "김*연 · 고3 수학"],
      ["고려대학교 합격", "이*준 · 재수 국어"],
      ["성균관대학교 합격", "박*서 · 고3 영어"],
      ["한양대학교 합격", "정*원 · 고3 수학"],
      ["이화여자대학교 합격", "최*아 · 고3 국어"],
      ["서강대학교 합격", "강*민 · 재수 수학"],
      ["중앙대학교 합격", "윤*재 · 고3 영어"],
      ["경희대학교 합격", "임*지 · 고3 과학"],
      ["건국대학교 합격", "한*수 · 고3 수학"],
      ["동국대학교 합격", "서*현 · 고3 국어"],
    ];
    const getHall = (key: string, fallback: string) =>
      getCmsSectionValue(siteContent, "hall", key, fallback);
    return Array.from({ length: 10 }, (_, i) => i + 1)
      .filter((n) => parseCmsVisibility(getHall(`hall${n}_visible`, "1"), true))
      .map((n) => ({
        image: getHall(`hall${n}_image`, `/images/photos/interviews/int-${n}.jpg`),
        title: getHall(`hall${n}_title`, HALL_FALLBACK[n - 1][0]),
        sub: getHall(`hall${n}_sub`, HALL_FALLBACK[n - 1][1]),
      }))
      .filter((it) => it.title);
  }, [siteContent]);

  const successCards: SuccessCard[] = useMemo(
    () =>
      SUCCESS_DEFAULTS.flatMap((d, idx) => {
        const n = idx + 1;
        const vis = getSuccess(`card${n}_visible`, "1");
        if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) return [];
        return [
          {
            n,
            from: getSuccess(`card${n}_from`, d.from),
            to: getSuccess(`card${n}_to`, d.to),
            result: getSuccess(`card${n}_result`, d.result),
            student: getSuccess(`card${n}_student`, d.student),
            tags: splitTags(getSuccess(`card${n}_tags`, d.tags.join("\n"))),
          },
        ];
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [siteContent],
  );

  const proofCards: ProofCard[] = useMemo(
    () =>
      PROOF_DEFAULTS.flatMap((d, idx) => {
        const n = idx + 1;
        const vis = getProof(`proof${n}_visible`, "1");
        if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) return [];
        return [
          {
            n,
            image: getProof(`proof${n}_image`, d.image),
            student: getProof(`proof${n}_student`, d.student),
            comment: getProof(`proof${n}_comment`, d.comment),
          },
        ];
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [siteContent],
  );

  const sortedTestimonials = useMemo(() => {
    const withBadge = testimonials.filter((t) => t.gradeFrom && t.gradeTo);
    const rest = testimonials.filter((t) => !(t.gradeFrom && t.gradeTo));
    return [...withBadge, ...rest];
  }, [testimonials]);

  const visibleTestimonials = useMemo(() => {
    if (activeCategory === "전체") return sortedTestimonials;
    return sortedTestimonials.filter((t) => t.category === activeCategory);
  }, [sortedTestimonials, activeCategory]);

  return (
    <main>
      {/* ── 다크 히어로 ── */}
      <section className="rp-hero">
        <div className="wrap rp-hero-inner">
          <div className="rp-hero-kicker">
            <CmsEdit active={isEditMode} section="reviews_page" cmsKey="hero_kicker" type="text">
              {get("hero_kicker", "REVIEWS")}
            </CmsEdit>
          </div>
          <h1>
            <CmsEdit active={isEditMode} section="reviews_page" cmsKey="hero_title" type="text">
              {(() => {
                const title = formatCmsMultiline(
                  get("hero_title", "Concord 학생이 직접 경험한\n성적 상승 후기를 만나보세요"),
                );
                const lines = title.split("\n").filter(Boolean);
                return lines.map((line, i) => (
                  <span key={`${i}-${line}`}>
                    {line.split(/(성적 상승)/).map((part, j) =>
                      part === "성적 상승" ? <em key={j}>{part}</em> : part,
                    )}
                    {i < lines.length - 1 ? <br /> : null}
                  </span>
                ));
              })()}
            </CmsEdit>
          </h1>
          <p className="rp-hero-sub">
            <CmsEdit active={isEditMode} section="reviews_page" cmsKey="hero_subtext" type="text">
              {get("hero_subtext", "학부모·학생이 직접 남긴 이야기와 변화의 기록입니다.")}
            </CmsEdit>
          </p>
        </div>
      </section>

      {/* ── 합격 인터뷰 카드 무한 캐러셀 ── */}
      <section className="sec-sm">
        <HallOfFameCarousel items={hallItems} />
      </section>

      {/* ── 성공사례 캐러셀 ── */}
      {successCards.length > 0 ? (
        <section className="sec">
          <div className="rp-sec-head">
            <h2>
              <CmsEdit active={isEditMode} section="reviews_success" cmsKey="section_title" type="text">
                {multilineNodes(getSuccess("section_title", "숫자로 확인하는\n성적 변화 사례"))}
              </CmsEdit>
            </h2>
          </div>
          <div className="rp-carousel" role="list" aria-label="성적 변화 사례">
            {successCards.map((card) => (
              <ConcordReveal key={card.n} as="article" className="card rp-success-card" role="listitem">
                <div className="rp-success-delta" aria-label={`${card.from}에서 ${card.to}로 향상`}>
                  <span className="rp-success-from">{card.from}</span>
                  <span className="rp-success-arrow" aria-hidden="true">→</span>
                  <span className="rp-success-to">{card.to}</span>
                </div>
                <p className="rp-success-result">{card.result}</p>
                <p className="rp-success-student">{card.student}</p>
                {card.tags.length > 0 ? (
                  <div className="tag-chip-row">
                    {card.tags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </ConcordReveal>
            ))}
          </div>
          <p className="rp-footnote">
            <CmsEdit active={isEditMode} section="reviews_success" cmsKey="section_footnote" type="text">
              {getSuccess("section_footnote", "* 학부모·학생 동의를 받아 게재한 사례로, 결과는 학생마다 다를 수 있습니다")}
            </CmsEdit>
          </p>
        </section>
      ) : null}

      {/* ── 통계 밴드 ── */}
      <section className="rp-band">
        <div className="wrap rp-band-inner">
          <h2>
            <CmsEdit active={isEditMode} section="reviews_page" cmsKey="band_title" type="text">
              {(() => {
                const title = formatCmsMultiline(
                  get("band_title", "Concord 학생 대부분이\n첫 3개월 안에 변화를 경험합니다"),
                );
                const lines = title.split("\n").filter(Boolean);
                return lines.map((line, i) => (
                  <span key={`${i}-${line}`}>
                    {line.split(/(변화)/).map((part, j) =>
                      part === "변화" ? <em key={j}>{part}</em> : part,
                    )}
                    {i < lines.length - 1 ? <br /> : null}
                  </span>
                ));
              })()}
            </CmsEdit>
          </h2>
          <div className="rp-band-stats">
            {[1, 2].map((n) => (
              <div key={n} className="rp-band-stat">
                <CountUpStat
                  className="rp-band-n"
                  value={get(`band_stat${n}_number`, n === 1 ? "98%" : "500+")}
                />
                <span className="rp-band-l">
                  <CmsEdit active={isEditMode} section="reviews_page" cmsKey={`band_stat${n}_label`} type="text">
                    {get(`band_stat${n}_label`, n === 1 ? "학생 만족도" : "매칭 완료")}
                  </CmsEdit>
                </span>
              </div>
            ))}
          </div>
          <p className="rp-footnote">
            <CmsEdit active={isEditMode} section="reviews_page" cmsKey="band_footnote" type="text">
              {get("band_footnote", "* Concord 운영 데이터 기준")}
            </CmsEdit>
          </p>
        </div>
      </section>

      {/* ── 실물 인증 카드 ── */}
      {proofCards.length > 0 ? (
        <section className="sec rp-proof-sec">
          <div className="wrap">
            <div className="rp-sec-head">
              <h2>
                <CmsEdit active={isEditMode} section="reviews_proof" cmsKey="section_title" type="text">
                  {multilineNodes(getProof("section_title", "기록으로 남은 변화,\n직접 확인해 보세요"))}
                </CmsEdit>
              </h2>
            </div>
            <div className="rp-proof-grid">
              {proofCards.map((card) => (
                <ConcordReveal key={card.n} as="article" className="card rp-proof-card">
                  <div className="rp-proof-media">
                    <CmsEdit active={isEditMode} section="reviews_proof" cmsKey={`proof${card.n}_image`} type="image">
                      <Image
                        src={card.image}
                        alt={`${card.student} 학습 기록 인증`}
                        fill
                        className="object-cover"
                        sizes="(max-width:900px) 100vw, 33vw"
                      />
                    </CmsEdit>
                  </div>
                  <div className="rp-proof-body">
                    <span className="rp-proof-student">{card.student}</span>
                    <p className="rp-proof-comment">{card.comment}</p>
                  </div>
                </ConcordReveal>
              ))}
            </div>
            <p className="rp-footnote">
              <CmsEdit active={isEditMode} section="reviews_proof" cmsKey="section_footnote" type="text">
                {getProof("section_footnote", "* 학부모·학생 동의를 받아 게재한 자료입니다")}
              </CmsEdit>
            </p>
          </div>
        </section>
      ) : null}

      {/* ── 고민 카테고리 후기 ── */}
      <section className="sec">
        <div className="wrap">
          <div className="rp-sec-head">
            <h2>
              <CmsEdit active={isEditMode} section="reviews_page" cmsKey="list_title" type="text">
                {multilineNodes(get("list_title", "성적보다 습관이\n먼저 바뀌었어요"))}
              </CmsEdit>
            </h2>
            <p>
              <CmsEdit active={isEditMode} section="reviews_page" cmsKey="list_subtext" type="text">
                {get(
                  "list_subtext",
                  "Concord와 함께한 가정의 실제 후기입니다. 비슷한 고민을 골라 살펴보세요.",
                )}
              </CmsEdit>
            </p>
          </div>

          <div className="rp-filter-row" role="tablist" aria-label="고민 카테고리">
            {["전체", ...REVIEW_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat}
                className={`rp-filter-chip${activeCategory === cat ? " on" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === "전체" ? "전체" : `#${cat}`}
              </button>
            ))}
          </div>

          {visibleTestimonials.length > 0 ? (
            <div className="rev-masonry">
              {visibleTestimonials.map((item) => (
                <ConcordReveal
                  key={`${item.info}-${item.quote.slice(0, 24)}`}
                  as="article"
                  className="card rev-card"
                >
                  {item.gradeFrom && item.gradeTo ? (
                    <div className="rev-grade" aria-label={`${item.gradeFrom}에서 ${item.gradeTo}로 향상`}>
                      <span className="rev-grade-from">{item.gradeFrom}</span>
                      <span className="rev-grade-arrow" aria-hidden="true">→</span>
                      <span className="rev-grade-to">{item.gradeTo}</span>
                    </div>
                  ) : (
                    <div className="rev-stars">★★★★★</div>
                  )}
                  <p className="qt">{item.quote}</p>
                  {item.tags && item.tags.length > 0 ? (
                    <div className="rev-tags">
                      {item.tags.map((tag) => (
                        <span key={tag} className="rev-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <ReviewByLine info={item.info} />
                </ConcordReveal>
              ))}
            </div>
          ) : (
            <p className="rp-empty">
              {get("empty_text", "해당 고민의 후기가 아직 없습니다. 다른 카테고리를 선택해 보세요.")}
            </p>
          )}
        </div>
      </section>

      <ConcordSubpageCta
        siteContent={siteContent}
        section="reviews_page"
        isEditMode={isEditMode}
        source="reviews_page_cta"
        title="우리 아이도 같은 변화를 경험할 수 있어요"
        description="무료 상담으로 학생에게 딱 맞는 학습 플랜을 확인해 보세요."
      />
    </main>
  );
}
