"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { CountUpStat } from "@/components/common/CountUpStat";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ConcordSubpageCta } from "@/components/concord/ConcordSubpageCta";
import { PricingPlanCards } from "@/components/pricing/PricingPlanCards";
import { useConsultationCta } from "@/hooks/useConsultationCta";
import {
  formatCmsMultiline,
  getCmsSectionValue,
  getFeaturedTutorCards,
  parseCmsVisibility,
  parseMultilineList,
  type FeaturedTutorCard,
} from "@/lib/cms-page-defaults";
import { buildVisiblePricingPlanItems } from "@/lib/pricing-cms";
import type { GroupedSiteContent } from "@/lib/site-content";

const SECTION = "tutors_featured";
const PROOF_SECTION = "tutors_proof";
const PROOF_COUNT = 6;

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
    <ConcordReveal as="article" className="card tutor-card tp-carousel-card">
      {card.tags.length > 0 ? (
        <div className="tag-chip-row tp-card-tags">
          {card.tags.slice(0, 3).map((t) => (
            <span key={t} className="tag-chip">
              {t}
            </span>
          ))}
        </div>
      ) : null}
      <div className="tutor-media" style={{ position: "relative", overflow: "hidden" }}>
        {card.tag ? <span className="tutor-tag">{card.tag}</span> : null}
        <Image
          src={card.photo}
          alt={`${card.name} 선생님 프로필 사진`}
          fill
          className="object-cover"
          sizes="(max-width:960px) 80vw, 33vw"
        />
      </div>
      <div className="tutor-body">
        {card.university ? <div className="tp-card-univ">{card.university}</div> : null}
        <p className="tutor-name">
          {card.name} <span className="verified">✓ 검증</span>
        </p>
        <p className="tutor-line">{card.blurb}</p>
        {card.highlights.length > 0 ? (
          <ul className="tutor-items">
            {card.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <div className="tp-card-foot">
          {card.subjects.length > 0 ? (
            <div className="tp-card-subjects">
              {card.subjects.slice(0, 3).map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          ) : null}
          {card.careerBadge ? <span className="tp-career-badge">{card.careerBadge}</span> : null}
        </div>
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

function TutorCarousel({
  cards,
  ctaLabel,
  onMatch,
}: {
  cards: FeaturedTutorCard[];
  ctaLabel: string;
  onMatch: (cardIndex: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const scrollByCard = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".tp-carousel-card");
    const amount = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className="tp-carousel-wrap">
      <button
        type="button"
        className="tp-carousel-arrow tp-arrow-prev"
        onClick={() => scrollByCard(-1)}
        disabled={atStart}
        aria-label="이전 선생님"
      >
        ‹
      </button>
      <div className="tp-carousel" role="list" ref={ref} onScroll={update}>
        {cards.map((card) => (
          <FeaturedCard key={card.index} card={card} ctaLabel={ctaLabel} onMatch={onMatch} />
        ))}
      </div>
      <button
        type="button"
        className="tp-carousel-arrow tp-arrow-next"
        onClick={() => scrollByCard(1)}
        disabled={atEnd}
        aria-label="다음 선생님"
      >
        ›
      </button>
    </div>
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
  const getProof = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, PROOF_SECTION, key, fallback);
  const edit = (cmsKey: string, children: React.ReactNode, type: "text" | "image" = "text") => (
    <CmsEdit active={isEditMode} section={SECTION} cmsKey={cmsKey} type={type}>
      {children}
    </CmsEdit>
  );

  const cards = getFeaturedTutorCards(siteContent);
  const ctaLabel = get("cta_label", "빠른 매칭받기");
  const badges = [
    get("badge_1", "첫 수업 후 100% 환불"),
    get("badge_2", "안 맞으면 무료 교체"),
    get("badge_3", "서류·시연·면접 3단계 검증"),
  ].filter(Boolean);

  const stats = [1, 2, 3]
    .map((n) => ({
      number: get(`stat${n}_number`, ""),
      label: get(`stat${n}_label`, ""),
    }))
    .filter((s) => s.number && s.label);

  const whys = [1, 2, 3]
    .map((n) => ({
      q: get(`why${n}_q`, ""),
      a: get(`why${n}_a`, ""),
      desc: get(`why${n}_desc`, ""),
    }))
    .filter((w) => w.q && w.a);

  const proofs = Array.from({ length: PROOF_COUNT }, (_, i) => i + 1)
    .filter((n) => parseCmsVisibility(siteContent?.[PROOF_SECTION]?.[`proof${n}_visible`], true))
    .map((n) => ({
      n,
      subject: getProof(`proof${n}_subject`, ""),
      before: getProof(`proof${n}_before`, ""),
      after: getProof(`proof${n}_after`, ""),
      months: getProof(`proof${n}_months`, ""),
      student: getProof(`proof${n}_student`, ""),
      image: getProof(`proof${n}_image`, `/images/placeholders/grade-proof-${n}.png`),
    }))
    .filter((p) => p.subject && p.before && p.after);

  const studentTags = parseMultilineList(get("iv_student_tags", ""), []);
  const teacherTags = parseMultilineList(get("iv_teacher_tags", ""), []);

  const pricingItems = buildVisiblePricingPlanItems(siteContent, "high");

  return (
    <main>
      {/* ── 다크 히어로 ── */}
      <section className="tp-hero">
        <div className="tp-hero-media" aria-hidden="true">
          {edit(
            "hero_image",
            <Image
              src={get("hero_image", "/images/placeholders/tutors-hero.png")}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />,
            "image",
          )}
        </div>
        <ConcordReveal className="wrap tp-hero-inner" as="div">
          <h1 style={{ whiteSpace: "pre-line" }}>
            {edit("hero_title", formatCmsMultiline(get("hero_title", "우리 아이와 잘 맞는 선생님,\nConcord에는 있습니다")))}
          </h1>
          <p className="tp-hero-sub">
            {edit("hero_subtext", get("hero_subtext", "학습 조건부터 학생 성향까지 정밀하게 맞추는 1:1 매칭"))}
          </p>
          <a href="#featured" className="btn btn-acc btn-lg tp-hero-btn">
            {get("hero_cta", "만나보기")} ↓
          </a>
        </ConcordReveal>
      </section>

      {/* ── 통계 카운터 ── */}
      {stats.length > 0 ? (
        <section className="sec-sm tp-stats-sec">
          <div className="wrap">
            <ConcordReveal className="tp-stats" as="div">
              {stats.map((s) => (
                <div key={s.label} className="tp-stat">
                  <CountUpStat value={s.number} className="tp-stat-n" />
                  <span className="tp-stat-l">{s.label}</span>
                </div>
              ))}
            </ConcordReveal>
            <p className="tp-footnote">{get("stats_footnote", "* Concord 운영 데이터 기준")}</p>
          </div>
        </section>
      ) : null}

      {/* ── 학생·선생님 인터뷰 매칭 ── */}
      <section className="sec tp-interview-sec">
        <div className="wrap">
          <ConcordReveal className="tp-sec-head" as="div">
            <h2 style={{ whiteSpace: "pre-line" }}>
              {edit("iv_title", formatCmsMultiline(get("iv_title", "잘 맞는 선생님을 만나면\n공부 전략이 달라집니다")))}
            </h2>
          </ConcordReveal>
          <div className="tp-iv-grid">
            <ConcordReveal className="card tp-iv-card" as="article">
              <div className="tp-iv-media">
                {edit(
                  "iv_student_image",
                  <Image
                    src={get("iv_student_image", "/images/placeholders/student-interview.png")}
                    alt="학생 인터뷰"
                    fill
                    className="object-cover"
                    sizes="(max-width:960px) 100vw, 50vw"
                  />,
                  "image",
                )}
              </div>
              <div className="tp-iv-body">
                <span className="tp-iv-label">{get("iv_student_label", "이런 수업 원해요")}</span>
                <blockquote style={{ whiteSpace: "pre-line" }}>
                  {formatCmsMultiline(get("iv_student_quote", "“강압적인 학원 수업에 지쳤어요.\n제 속도에 맞춰 다시 시작하고 싶어요”"))}
                </blockquote>
                <div className="tag-chip-row">
                  {studentTags.map((t) => (
                    <span key={t} className="tag-chip">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </ConcordReveal>
            <ConcordReveal className="card tp-iv-card" as="article">
              <div className="tp-iv-media">
                {edit(
                  "iv_teacher_image",
                  <Image
                    src={get("iv_teacher_image", "/images/placeholders/teacher-interview.png")}
                    alt="선생님 인터뷰"
                    fill
                    className="object-cover"
                    sizes="(max-width:960px) 100vw, 50vw"
                  />,
                  "image",
                )}
              </div>
              <div className="tp-iv-body">
                <span className="tp-iv-label">{get("iv_teacher_label", "이런 수업 잘해요")}</span>
                <blockquote style={{ whiteSpace: "pre-line" }}>
                  {formatCmsMultiline(get("iv_teacher_quote", "“칭찬으로 학생이 스스로\n공부하게 만듭니다”"))}
                </blockquote>
                <div className="tag-chip-row">
                  {teacherTags.map((t) => (
                    <span key={t} className="tag-chip">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </ConcordReveal>
          </div>
          <p className="tp-footnote">{get("iv_footnote", "*실제 인터뷰를 바탕으로 재구성했습니다")}</p>
        </div>
      </section>

      {/* ── 이달의 검증 선생님 ── */}
      <section className="sec tp-featured-sec" id="featured" style={{ scrollMarginTop: "80px" }}>
        <div className="wrap">
          <ConcordReveal className="tp-sec-head" as="div">
            <span className="eyebrow">{edit("header_kicker", get("header_kicker", "TEACHERS"))}</span>
            <h2>{edit("header_title", get("header_title", "이달의 검증 선생님"))}</h2>
            <p>
              {edit(
                "header_subtext",
                get(
                  "header_subtext",
                  "지원자 절반이 탈락하는 선발을 통과한 선생님만 소개합니다. 마음에 드는 선생님으로 무료 상담을 신청하시면 매니저가 매칭을 도와드립니다.",
                ),
              )}
            </p>
          </ConcordReveal>

          {badges.length > 0 ? (
            <ConcordReveal className="tutor-badge-row" aria-label="보장 안내">
              {badges.map((b) => (
                <span key={b} className="tutor-badge">
                  {b}
                </span>
              ))}
            </ConcordReveal>
          ) : null}
        </div>

        <TutorCarousel
          cards={cards}
          ctaLabel={ctaLabel}
          onMatch={(i) => void goConsultation(`tutors_featured_${i}`)}
        />
      </section>

      {/* ── 특별한 이유 3가지 (Q&A) ── */}
      {whys.length > 0 ? (
        <section className="sec tp-why-sec">
          <div className="wrap">
            <ConcordReveal className="tp-sec-head" as="div">
              <h2 style={{ whiteSpace: "pre-line" }}>
                {edit("why_title", formatCmsMultiline(get("why_title", "Concord 선생님이\n특별한 이유 3가지")))}
              </h2>
            </ConcordReveal>
            <div className="tp-why-grid">
              {whys.map((w, i) => (
                <ConcordReveal key={w.q} className="card tp-why-card" as="article">
                  <span className="tp-why-q">{w.q}</span>
                  <h3>{w.a}</h3>
                  <p>{w.desc}</p>
                  <span className="tp-why-n">0{i + 1}</span>
                </ConcordReveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── 성적 인증 그리드 ── */}
      {proofs.length > 0 ? (
        <section className="sec tp-proof-sec">
          <div className="wrap">
            <ConcordReveal className="tp-sec-head" as="div">
              <h2 style={{ whiteSpace: "pre-line" }}>
                <CmsEdit active={isEditMode} section={PROOF_SECTION} cmsKey="section_title" type="text">
                  {formatCmsMultiline(
                    getProof("section_title", "학원에서는 성적이 안 올랐다면?\nConcord 학생들은 지금도 오르고 있습니다"),
                  )}
                </CmsEdit>
              </h2>
            </ConcordReveal>
            <div className="tp-proof-grid">
              {proofs.map((p) => (
                <ConcordReveal key={p.n} className="card tp-proof-card" as="article">
                  <div className="tp-proof-media">
                    <CmsEdit active={isEditMode} section={PROOF_SECTION} cmsKey={`proof${p.n}_image`} type="image">
                      <Image
                        src={p.image}
                        alt={`${p.student} 성적 인증`}
                        fill
                        className="object-cover"
                        sizes="(max-width:960px) 100vw, 33vw"
                      />
                    </CmsEdit>
                  </div>
                  <div className="tp-proof-body">
                    <span className="tp-proof-student">{p.student}</span>
                    <p className="tp-proof-line">
                      <strong>{p.subject}</strong> {p.before}
                      <span className="arr">→</span>
                      <em>{p.after}</em>
                    </p>
                    {p.months ? <span className="tp-proof-months">{p.months} 만에 달성</span> : null}
                  </div>
                </ConcordReveal>
              ))}
            </div>
            <p className="tp-footnote">
              {getProof("section_footnote", "* 학부모·학생 동의를 받아 게재한 사례입니다")}
            </p>
          </div>
        </section>
      ) : null}

      {/* ── 변경 보장 ── */}
      <section className="sec-sm">
        <div className="wrap">
          <ConcordReveal className="tp-rematch-band" as="div">
            <div>
              <h2>{edit("rematch_title", get("rematch_title", "선생님이 마음에 안 들면 어떡하죠?"))}</h2>
              <p>
                {edit(
                  "rematch_subtext",
                  get("rematch_subtext", "마음에 들 때까지 선생님을 만나보세요. 변경 비용은 0원입니다."),
                )}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-lg tp-rematch-btn"
              onClick={() => void goConsultation("tutors_rematch")}
            >
              {get("rematch_cta", "맞춤 선생님 제안 받기")}
            </button>
          </ConcordReveal>
        </div>
      </section>

      {/* ── 요금제 카드 ── */}
      <section className="sec tp-price-sec">
        <div className="wrap">
          <ConcordReveal className="tp-sec-head" as="div">
            <span className="eyebrow">{edit("price_kicker", get("price_kicker", "PLANS"))}</span>
            <h2>{edit("price_title", get("price_title", "맞춤수업부터 관리까지, 한 번에"))}</h2>
            <p>
              {edit(
                "price_subtext",
                get("price_subtext", "모든 플랜에 학습 리포트·매니저 관리·강사 첨삭이 포함됩니다. 상담 신청은 30초면 충분합니다."),
              )}
            </p>
          </ConcordReveal>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <PricingPlanCards items={pricingItems} tier="high" sourcePrefix="tutors_pricing_plan" />
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
