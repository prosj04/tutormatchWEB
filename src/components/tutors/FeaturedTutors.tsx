"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { CountUpStat } from "@/components/common/CountUpStat";
import { TutorProfileCard } from "@/components/tutors/TutorProfileCard";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ConcordSubpageCta } from "@/components/concord/ConcordSubpageCta";
import { useConsultationCta } from "@/hooks/useConsultationCta";
import {
  formatCmsMultiline,
  getCmsSectionValue,
  getFeaturedTutorCards,
  parseCmsVisibility,
  type FeaturedTutorCard,
} from "@/lib/cms-page-defaults";
import type { GroupedSiteContent } from "@/lib/site-content";

const SECTION = "tutors_featured";
const PROOF_SECTION = "tutors_proof";
const PROOF_COUNT = 6;

const NEWS_REF_FALLBACK: [string, string, string, string][] = [
  ["“딸이 유혹했다” 적반하장 대학생 과외 교사… 1심 집행유예에 ‘공분’", "뉴시스", "2026", "https://www.newsis.com/view/NISX20260410_0003585764"],
  ["‘정**’ 사건에 불안 커진 과외 중개 앱…", "서울신문", "2023", "https://www.seoul.co.kr/news/newsView.php?id=20230604500093"],
  ["학원 화장실에 ‘몰래카메라 설치’… 警, 50대 원장 입건", "경인일보", "2020", "https://www.kyeongin.com/article/1523526"],
];

function TutorCarousel({
  cards,
  ctaLabel,
  onMatch,
}: {
  cards: FeaturedTutorCard[];
  ctaLabel: string;
  onMatch: (cardIndex: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(cards.length); // 확장 배열(3벌) 가운데 벌에서 시작
  const [anim, setAnim] = useState(true);
  const [paused, setPaused] = useState(false);
  const len = cards.length;
  const extended = [...cards, ...cards, ...cards];

  const applyTransform = useCallback(
    (p: number, withAnim: boolean) => {
      const track = trackRef.current;
      const wrap = wrapRef.current;
      if (!track || !wrap) return;
      const cardEl = track.querySelector<HTMLElement>(".tpx-card");
      if (!cardEl) return;
      const gap = 28;
      const w = cardEl.offsetWidth;
      const x = wrap.clientWidth / 2 - (p * (w + gap) + w / 2);
      track.style.transition = withAnim ? "transform .55s cubic-bezier(0.22, 1, 0.36, 1)" : "none";
      track.style.transform = `translateX(${x}px)`;
    },
    [],
  );

  useEffect(() => {
    applyTransform(pos, anim);
  }, [pos, anim, applyTransform]);

  useEffect(() => {
    const onResize = () => applyTransform(pos, false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos, applyTransform]);

  // 경계 넘어가면 무전환 점프로 무한 순환
  useEffect(() => {
    if (pos >= len * 2 || pos < len) {
      const t = window.setTimeout(() => {
        setAnim(false);
        setPos((p) => ((p % len) + len % len === 0 ? (p % len) + len : ((p % len) + len)));
        window.setTimeout(() => setAnim(true), 30);
      }, 570);
      return () => window.clearTimeout(t);
    }
  }, [pos, len]);

  const go = useCallback((dir: number) => {
    setAnim(true);
    setPos((p) => p + dir);
  }, []);

  // 1.5초 자동 오른쪽 순환 (호버·조작 시 일시정지/리셋)
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => go(1), 3000);
    return () => window.clearInterval(id);
  }, [paused, go, pos]);

  return (
    <div
      className="tpx-wrap"
      ref={wrapRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="tpx-track" ref={trackRef}>
        {extended.map((card, i) => (
          <TutorProfileCard
            key={`${card.index}-${i}`}
            card={card}
            ctaLabel={ctaLabel}
            onMatch={onMatch}
            isCenter={i === pos}
          />
        ))}
      </div>
      <button type="button" className="tpx-arrow tpx-prev" onClick={() => go(-1)} aria-label="이전 선생님">
        ‹
      </button>
      <button type="button" className="tpx-arrow tpx-next" onClick={() => go(1)} aria-label="다음 선생님">
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
  const secVisible = (key: string) =>
    parseCmsVisibility(siteContent?.[SECTION]?.[key], true);
  const ctaLabel = get("cta_label", "빠른 매칭받기");
  const badges = [
    get("badge_1", "첫 수업 후 100% 환불"),
    get("badge_2", "안 맞으면 무료 교체"),
    get("badge_3", "서류·시연·면접 3단계 검증"),
  ].filter(Boolean);

  const STAT_FALLBACK: [string, string][] = [
    ["500+", "누적 매칭"],
    ["98%", "첫 수업 만족도"],
    ["47%", "선발 통과율"],
  ];
  const stats = [1, 2, 3]
    .map((n) => ({
      number: get(`stat${n}_number`, STAT_FALLBACK[n - 1][0]),
      label: get(`stat${n}_label`, STAT_FALLBACK[n - 1][1]),
    }))
    .filter((s) => s.number && s.label);

  const WHY_FALLBACK: [string, string, string][] = [
    ["다 같은 명문대 출신 아닌가요?", "같은 학벌이어도 다릅니다", "서류·수업 시연·대면 인터뷰 3단계로 인성부터 강의력까지 검증합니다."],
    ["대학생이라 무책임하지 않나요?", "믿고 맡길 수 있습니다", "매 수업이 끝나면 진도와 피드백을 리포트로 공유해 바로 확인할 수 있습니다."],
    ["교습 경험이 있는 선생님인가요?", "검증된 경력 위주로 선발합니다", "교습 경험과 지도 사례를 확인한 선생님을 우선 배정합니다."],
  ];
  const whys = [1, 2, 3]
    .map((n) => ({
      q: get(`why${n}_q`, WHY_FALLBACK[n - 1][0]),
      a: get(`why${n}_a`, WHY_FALLBACK[n - 1][1]),
      desc: get(`why${n}_desc`, WHY_FALLBACK[n - 1][2]),
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

      
      
      
      
      {/* ── 특별한 이유 3가지 (Q&A) ── */}
      {whys.length > 0 && secVisible("why_section_visible") ? (
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

      {/* ── 이달의 검증 선생님 ── */}
      {secVisible("featured_section_visible") && (
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
                  "3단계 검증을 통과한 선생님만 소개합니다. 마음에 드는 선생님이 있다면 상담에서 말씀해 주세요. 매니저가 매칭 가능 여부를 확인해 드려요.",
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
      )}

      {/* ── 통계 카운터 ── */}
      {stats.length > 0 && secVisible("stats_section_visible") ? (
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

      {/* ── 뉴스 근거: 대형 타이포 스택 (흰 배경) ── */}
      {secVisible("news_section_visible") && (
      <section className="sec tp-newsintro-sec">
        <div className="wrap">
          <ConcordReveal className="tp-newsintro-head" as="div">
            <h2>{getCmsSectionValue(siteContent, "safety_story", "tutors_lead", "대표가 모든 선생님을 직접 만나는 이유")}</h2>
          </ConcordReveal>
          <div className="tp-newsintro-stack">
            {NEWS_REF_FALLBACK.map(([fq, fp, fy], idx) => {
              const n = idx + 1;
              const quote = getCmsSectionValue(siteContent, "safety_story", `news${n}_quote`, fq);
              const press = getCmsSectionValue(siteContent, "safety_story", `news${n}_press`, fp);
              const year = getCmsSectionValue(siteContent, "safety_story", `news${n}_year`, fy);
              if (!quote) return null;
              return (
                <ConcordReveal key={n} as="div">
                  <div className="tp-newsintro-line">
                    <span className="q">{quote}</span>
                    <span className="s">{year} · {press}</span>
                  </div>
                </ConcordReveal>
              );
            })}
          </div>
          <ConcordReveal as="div">
            <p className="tp-newsintro-note">
              {getCmsSectionValue(siteContent, "safety_story", "news_note", "실제 보도된 사건입니다")}
            </p>
          </ConcordReveal>
          <ConcordReveal as="div">
            <p className="tp-newsintro-empathy">
              {getCmsSectionValue(
                siteContent,
                "safety_story",
                "news_empathy",
                "그 불안을 알기에, 모든 선생님을 직접 만나 확인합니다.",
              )}
            </p>
          </ConcordReveal>
        </div>
      </section>
      )}

      {/* ── 성적 인증 그리드 ── */}
      {proofs.length > 0 && secVisible("proof_section_visible") ? (
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
      {secVisible("rematch_section_visible") && (
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
      )}

      
      <ConcordSubpageCta
        title="원하는 선생님, 무료 상담으로 배정받으세요"
        description="학년·과목·목표에 맞춰 매니저가 최적의 강사진을 추천해 드립니다."
        source="tutors_page_cta"
      />
    </main>
  );
}
