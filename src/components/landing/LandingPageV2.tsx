"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import type { LandingCmsContent } from "@/lib/cms";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { HomeSafetyStory, type SafetyStoryData } from "@/components/landing/HomeSafetyStory";
import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { PricingPlanCards } from "@/components/pricing/PricingPlanCards";
import {
  formatCmsMultiline,
  getFeaturedTutorCards,
  parseCmsVisibility,
} from "@/lib/cms-page-defaults";
import { buildVisiblePricingPlanItems } from "@/lib/pricing-cms";
import { usePricingSchoolTier } from "@/lib/pricing-tier-preference";
import { useConsultationCta } from "@/hooks/useConsultationCta";
import { RESULT_CARD_IMAGES } from "@/lib/result-card-images";

/* ─── static fallback data ─── */
const DEFAULT_RESULT_IMAGES = [...RESULT_CARD_IMAGES];

const results: [string, string, string, string][] = [
  ["고2 학생", "수학 5등급", "2등급으로 상승", "3개월"],
  ["중3 학생", "영어 64점", "87점으로 상승", "4개월"],
  ["고1 학생", "국어 55점", "78점으로 상승", "3개월"],
  ["중2 학생", "수학 85점", "100점으로 상승", "2개월"],
  ["고3 학생", "영어 5등급", "3등급으로 상승", "5개월"],
  ["고1 학생", "수학 69점", "92점으로 상승", "3개월"],
];

const steps = [
  { number: "01", title: "무료 상담 신청", desc: "학생의 현재 성적, 목표, 성향을 간단히 남겨주세요. 30초면 충분합니다." },
  { number: "02", title: "매니저 배정·진단 상담", desc: "10년 경력 매니저가 학습 상황과 가족의 우선순위를 듣습니다." },
  { number: "03", title: "선생님 후보 추천", desc: "과목, 성향, 일정에 맞는 선생님 후보를 추천합니다." },
  { number: "04", title: "학생이 직접 수락", desc: "배정된 선생님을 학생이 수락해야 수업이 시작됩니다. 맞지 않으면 무료로 재매칭합니다." },
  { number: "05", title: "방문 수업 시작", desc: "서울·분당 방문 수업으로 진행하고, 진도·숙제·리포트를 한 흐름으로 관리합니다." },
];

const trustBarItems = [
  "서울·분당 방문 수업",
  "전담 매니저가 처음부터 끝까지",
  "학생이 수락해야 수업 시작",
  "첫 수업 100% 환불",
];

/** CMS pricing_title may be two lines; avoid repeating "1:1 맞춤 과외," in the highlight. */
function heroHeadlineWithHl(text: string) {
  const lines = formatCmsMultiline(text).split("\n");
  return lines.map((line, lineIndex) => (
    <span key={line}>
      {line.split(/(선생님)/).map((part, partIndex) =>
        part === "선생님" ? (
          <span key={partIndex} className="lp2-hl">
            {part}
          </span>
        ) : (
          part
        ),
      )}
      {lineIndex < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

function buildLandingCmsView(cms?: LandingCmsContent) {
  const getCmsValue = (section: string, key: string, fallback: string) =>
    cms?.siteContent[section]?.[key] ?? fallback;
  const getCmsMultiline = (section: string, key: string, fallback: string) =>
    formatCmsMultiline(getCmsValue(section, key, fallback));

  const cmsResults = results.flatMap(([student, before, after, months], index) => {
    const n = index + 1;
    const vis = getCmsValue("results", `result${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) return [];
    return [
      {
        student: getCmsValue("results", `result${n}_student`, student),
        before: getCmsValue("results", `result${n}_before`, before).replace(/→\s*$/, ""),
        after: getCmsValue("results", `result${n}_after`, after),
        months: getCmsValue("results", `result${n}_months`, months),
        image: getCmsValue(
          "results",
          `result${n}_image`,
          DEFAULT_RESULT_IMAGES[index] ?? DEFAULT_RESULT_IMAGES[0],
        ),
      },
    ];
  });
  const doubledResults = cmsResults.length > 0 ? [...cmsResults, ...cmsResults] : [];

  const cmsSteps = steps.flatMap((step, index) => {
    const n = index + 1;
    const vis = getCmsValue("features", `step${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, n <= 5)) return [];
    return [
      {
        ...step,
        title: getCmsValue("features", `step${n}_title`, step.title),
        desc: getCmsMultiline("features", `step${n}_desc`, step.desc),
      },
    ];
  });

  const managementItems = [1, 2, 3].flatMap((n) => {
    const vis = getCmsValue("management", `item${n}_visible`, "1");
    if (!parseCmsVisibility(vis.trim() === "" ? undefined : vis, true)) return [];
    const defaults: Record<number, { label: string; desc: string }> = {
      1: {
        label: "학부모 안심리뷰",
        desc: "매 수업이 끝날 때마다 진도, 피드백, 숙제, 다음 일정을 정리해 보내드립니다.",
      },
      2: {
        label: "맞춤형 월간 리포트",
        desc: "우리 아이의 성장과 변화, 취약 유형 분석을 한 달 단위 리포트로 확인하실 수 있습니다.",
      },
      3: {
        label: "매니저 상담",
        desc: "선생님께 직접 말하기 어려운 요청은 매니저에게 전하세요. 수업에 반영되도록 조율합니다.",
      },
    };
    const d = defaults[n]!;
    return [
      {
        n,
        label: getCmsValue("management", `item${n}_title`, d.label),
        desc: getCmsMultiline("management", `item${n}_desc`, d.desc),
      },
    ];
  });

  const cmsTestimonials =
    cms && cms.testimonials.length > 0
      ? cms.testimonials.slice(0, 3)
      : [
          {
            quote:
              "공부하러 가서도 시간만 보내던 아이가 처음으로 공부 계획을 직접 잡고 실행했어요. 정말 아이에 맞는 선생님을 찾아주셔서 안심됐습니다.",
            info: "고2 수학 · 학부모",
            img: "",
          },
          {
            quote:
              "방황하는 아들의 방향을 잡아 줄 선생님이 필요했는데, 정확히 맞는 분을 찾아줬어요. 아이가 선생님처럼 되고 싶다며 열심히 합니다.",
            info: "고3 수학 · 학부모",
            img: "",
          },
          {
            quote:
              "숙제와 공부 계획을 등록하고 선생님이랑 같이 점검하니 자연스럽게 매일 공부하게 됐어요. 성적보다 습관이 먼저 바뀌었어요.",
            info: "중3 영어 · 학생",
            img: "",
          },
        ];

  const kickers = {
    teachers: getCmsValue("home_labels", "kicker_teachers", "Teachers"),
    management: getCmsValue("home_labels", "kicker_management", "Learning Care"),
    process: getCmsValue("home_labels", "kicker_process", "Process"),
    plans: getCmsValue("home_labels", "kicker_plans", "Plans"),
    reviews: getCmsValue("home_labels", "kicker_reviews", "Reviews"),
  };

  const sectionTitles = {
    problem: getCmsMultiline(
      "home_problem",
      "headline",
      "선생님을 잘못 만나면\n1~2달을 잃습니다",
    ),
    problemSubtext: getCmsValue(
      "home_problem",
      "subtext",
      "핏이 맞지 않는 수업은 성적보다 시간을 먼저 갉아먹습니다. Concord는 처음부터 학생에게 맞는 선생님을 찾는 데 집중합니다.",
    ),
    management: getCmsMultiline("management", "headline", "아이가 말해주지 않아도,\n아실 수 있습니다"),
    process: getCmsValue("features", "section_title", "Concord는 이렇게 진행됩니다"),
    processSubtext: getCmsValue("features", "section_subtext", "상담부터 매칭, 방문 수업까지 1:1로 학생의 성장에 집중해요."),
    teachers: getCmsMultiline("tutors_featured", "home_title", "선생님을 고르지 마세요,\n추천받으세요"),
    teachersSubtext: getCmsValue(
      "tutors_featured",
      "home_subtext",
      "지원자 절반이 탈락하는 선발을 통과한 선생님만 소개합니다. 마음에 드는 선생님으로 상담을 신청하시면 매니저가 매칭을 도와드립니다.",
    ),
    reviews: getCmsValue("home_labels", "section_title_reviews", "실제 학부모님들의 이야기를 확인해보세요"),
    plans: getCmsMultiline("home_page", "plans_title", "포함된 걸 먼저 보고 결정하세요"),
    plansSubtext: getCmsValue(
      "home_page",
      "plans_subtext",
      "학습 리포트·매니저 관리·강사 첨삭이 모든 플랜에 포함됩니다. 정확한 요금은 상담에서 아이에 맞춰 안내드립니다.",
    ),
  };

  return {
    getCmsValue,
    getCmsMultiline,
    cmsResults,
    doubledResults,
    cmsSteps,
    managementItems,
    cmsTestimonials,
    featuredTutors: getFeaturedTutorCards(cms?.siteContent).slice(0, 3),
    kickers,
    sectionTitles,
  };
}

/* ─── scroll-reveal hook ─── */
function useReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
    };
  }, []);
}

/* ─── main component ─── */
export function LandingPageV2({
  cms,
  isEditMode = false,
}: {
  cms?: LandingCmsContent;
  isEditMode?: boolean;
}) {
  useReveal();
  const goConsultation = useConsultationCta();
  const [tier, setTier] = usePricingSchoolTier();

  const {
    getCmsValue,
    getCmsMultiline,
    cmsResults,
    doubledResults,
    cmsSteps,
    managementItems,
    cmsTestimonials,
    featuredTutors,
    kickers,
    sectionTitles,
  } = useMemo(() => buildLandingCmsView(cms), [cms]);

  const pricingItems = useMemo(
    () => buildVisiblePricingPlanItems(cms?.siteContent, tier),
    [cms?.siteContent, tier],
  );

  const safetyStory: SafetyStoryData = useMemo(() => {
    const S = "safety_story";
    const newsDefaults = [
      ["“13세 성추행 과외교사는 ○○○” 사진·이름 등 신상 확산…", "서울신문", "2026", "https://www.seoul.co.kr/news/society/2026/04/14/20260414500211"],
      ["‘정유정’ 사건에 불안 커진 과외 중개 앱…", "서울신문", "2023", "https://www.seoul.co.kr/news/newsView.php?id=20230604500093"],
      ["학원 화장실에 ‘몰래카메라 설치’… 警, 50대 원장 입건", "경인일보", "2020", "https://www.kyeongin.com/article/1523526"],
    ] as const;
    const stepDefaults = [
      ["대표 직접 면접", "인품, 학력, 신원, 수업 실력.\n4가지 분야를 대표가 직접 전원 면접하고 교육하며, 엄격하게 검증된 선생님만 함께하고 있습니다."],
      ["매니저 직접 매칭", "학생의 공부 성향과 원하는 수업 방향을 상담을 통해 파악하고, 가장 적합한 선생님을 배정합니다."],
      ["공부 계획·질문 관리", "수업보다도 수업 이후 학생의 공부가 성적을 가릅니다.\n매 수업마다 숙제와 공부 계획을 시스템에 등록하고, 선생님은 상시 질의응답과 숙제 피드백을 제공합니다."],
      ["매월 수업 리포트 제공", "누구보다 학생의 공부를 잘 아는 선생님이 매월 직접 리포트를 작성합니다.\n선생님의 생각과 계획을 학생, 학부모와 숨김없이 공유하여 같은 목표로 나아갑니다."],
      ["매니저의 사후 관리", "배정 이후에도 매니저가 상시 관리합니다. 선생님이 맞지 않는다면 언제든 비용 없이 교체할 수 있고,\n언제든 매니저 상담을 요청하실 수 있습니다."],
    ] as const;
    return {
      intro: getCmsMultiline(S, "intro", "과외는 많은 학생에게 최고의 해결책이지만.."),
      closer: getCmsMultiline(S, "closer", "여전히 검증은 학생의 몫입니다"),
      pivot: getCmsMultiline(S, "pivot", "부담 없이 수업에만 집중할 수 있도록,\n우리는 최고의 선생님만 배정합니다."),
      newsNote: getCmsValue(S, "news_note", "실제 보도된 사건입니다 · 각 항목은 원문 기사로 연결됩니다"),
      news: newsDefaults.map(([quote, press, year, url], i) => ({
        quote: getCmsValue(S, `news${i + 1}_quote`, quote),
        press: getCmsValue(S, `news${i + 1}_press`, press),
        year: getCmsValue(S, `news${i + 1}_year`, year),
        url: getCmsValue(S, `news${i + 1}_url`, url),
      })),
      steps: stepDefaults.map(([title, desc], i) => ({
        title: getCmsValue(S, `step${i + 1}_title`, title),
        desc: getCmsMultiline(S, `step${i + 1}_desc`, desc),
      })),
    };
  }, [getCmsValue, getCmsMultiline]);

  return (
    <div className="lp2-root">
      {/* ══ 1. HERO ═══════════════════════════════════════ */}
      <section className="lp2-hero">
        <div className="lp2-hero-bg" />
        <div className="lp2-wrap lp2-hero-inner reveal">
          <div className="lp2-hero-cols">
            <div className="lp2-hero-main">
              <span className="lp2-eyebrow">Concord Private Tutoring</span>
              <h1 style={{ whiteSpace: "pre-line" }}>
                <CmsEdit active={isEditMode} section="hero" cmsKey="headline" type="text">
                  {heroHeadlineWithHl(
                    getCmsValue("hero", "headline", "학생마다 맞는\n선생님이 다릅니다"),
                  )}
                </CmsEdit>
              </h1>
              <p className="lp2-lede">
                <CmsEdit active={isEditMode} section="hero" cmsKey="subtext" type="text">
                  {getCmsMultiline(
                    "hero",
                    "subtext",
                    "2학기를 뒤집는 여름방학, 잘 맞는 선생님에서 시작됩니다.",
                  )}
                </CmsEdit>
              </p>
              <div className="lp2-cta-row">
                <ConsultationApplyButton className="lp2-btn lp2-btn-acc" source="home_hero">
                  <CmsEdit active={isEditMode} section="hero" cmsKey="cta_primary" type="text">
                    {getCmsValue("hero", "cta_primary", "딱 맞는 선생님 추천받기")}
                  </CmsEdit>
                </ConsultationApplyButton>
                <a href="#teachers" className="lp2-btn lp2-btn-ghost">
                  <CmsEdit active={isEditMode} section="hero" cmsKey="cta_secondary" type="text">
                    {getCmsValue("hero", "cta_secondary", "선생님 둘러보기 →")}
                  </CmsEdit>
                </a>
              </div>
              <p className="lp2-cta-note">상담 신청은 30초면 충분합니다</p>
            </div>

            <div className="lp2-hero-visual" aria-hidden="true">
              <div className="lp2-hero-model">
                <CmsEdit active={isEditMode} section="hero" cmsKey="model_image" type="image">
                  <Image
                    src={getCmsValue("hero", "model_image", "/images/placeholders/hero-model.png")}
                    alt=""
                    fill
                    sizes="(max-width:960px) 84vw, 400px"
                    className="object-cover"
                    priority
                  />
                </CmsEdit>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. TRUST BAR ══════════════════════════════════ */}
      <section className="lp2-trustbar" aria-label="핵심 안내">
        <div className="lp2-wrap">
          <ul className="lp2-trustbar-row reveal">
            {trustBarItems.map((item) => (
              <li key={item}>
                <span className="lp2-trustbar-dot" aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ 3. SAFETY STORY (스크롤텔링: 밝음 → 뉴스 다크 → 절차 밝음) ══ */}
      <HomeSafetyStory data={safetyStory} />

      {/* ══ 4. PROCESS (Concord 방식 5단계) ════════════════ */}
      <section id="process" className="lp2-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">{kickers.process}</span>
            <h2>{sectionTitles.process}</h2>
            <p>{sectionTitles.processSubtext}</p>
          </div>

          <div className="lp2-proc-cols">
            <div className="lp2-proc-list">
              {cmsSteps.map((step, index) => (
                <details key={step.number} className="lp2-proc-item reveal" open={index === 0}>
                  <summary>
                    <span className="lp2-proc-n">{step.number}</span>
                    <span className="lp2-proc-t">{step.title}</span>
                    <span className="lp2-faq-ind" aria-hidden="true">+</span>
                  </summary>
                  <p className="lp2-proc-p">{step.desc}</p>
                </details>
              ))}
            </div>

            <div className="lp2-proc-mock reveal" aria-hidden="true">
              <div className="lp2-notif-card">
                <div className="lp2-notif-head">
                  <span className="lp2-proof-dot" />
                  상담 신청 접수
                  <span className="t">오늘 14:02</span>
                </div>
                <p>담당 매니저가 24시간 안에 연락드립니다.</p>
              </div>
              <div className="lp2-notif-card">
                <div className="lp2-notif-head">
                  <span className="lp2-proof-dot" />
                  방문 상담 확정
                  <span className="t">수요일 15:00</span>
                </div>
                <p>매니저가 직접 방문해 학생의 상황을 듣습니다.</p>
              </div>
              <div className="lp2-notif-card">
                <div className="lp2-notif-head">
                  <span className="lp2-proof-dot" />
                  선생님 배정
                  <span className="t">수락 대기</span>
                </div>
                <p>Teacher Noah · 서울대 수리과학부</p>
                <span className="lp2-notif-btn">수락하고 첫 수업 잡기</span>
              </div>
              <div className="lp2-proc-mock-note">학생이 직접 수락해야 수업이 시작됩니다</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 5. FEATURED TEACHERS ══════════════════════════ */}
      <section id="teachers" className="lp2-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">{kickers.teachers}</span>
            <h2 style={{ whiteSpace: "pre-line" }}>{sectionTitles.teachers}</h2>
            <p>{sectionTitles.teachersSubtext}</p>
          </div>

          <div className="lp2-verify-row reveal" aria-label="선발 절차">
            <span className="lp2-verify-pill">
              <em>01</em> 서류·학력 인증
            </span>
            <span className="lp2-verify-sep" aria-hidden="true">→</span>
            <span className="lp2-verify-pill">
              <em>02</em> 수업 시연
            </span>
            <span className="lp2-verify-sep" aria-hidden="true">→</span>
            <span className="lp2-verify-pill">
              <em>03</em> 대면 인터뷰
            </span>
          </div>

          <div className="lp2-grid-3 lp2-ft-grid">
            {featuredTutors.map((card) => {
              const chips = [
                ...(card.tag ? [card.tag] : []),
                ...card.subjects,
              ].slice(0, 3);
              return (
                <article key={card.index} className="lp2-ft-card reveal">
                  <div className="lp2-ft-photo">
                    <Image
                      src={card.photo}
                      alt={`${card.name} 선생님 프로필 사진`}
                      fill
                      sizes="(max-width:680px) 90vw, 33vw"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="lp2-ft-body">
                    {chips.length > 0 && (
                      <div className="tag-chip-row">
                        {chips.map((chip) => (
                          <span key={chip} className="tag-chip">#{chip}</span>
                        ))}
                      </div>
                    )}
                    <div className="lp2-ft-name">
                      {card.name}
                      <span className="lp2-ft-verified">✓ 검증</span>
                    </div>
                    {card.university && <div className="lp2-ft-edu">{card.university}</div>}
                    {card.blurb && <p className="lp2-ft-blurb">{card.blurb}</p>}
                    <button
                      type="button"
                      className="lp2-btn lp2-btn-acc lp2-btn-sm lp2-ft-btn"
                      onClick={() => void goConsultation(`home_featured_${card.index}`)}
                    >
                      빠른 매칭받기
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="lp2-cta-row" style={{ marginTop: 40 }}>
            <Link href="/tutors" className="lp2-btn lp2-btn-ghost">
              선생님 전체 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 6. LEARNING CARE ══════════════════════════════ */}
      <section id="management" className="lp2-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-care-cols">
            <div className="lp2-care-left">
              <div className="lp2-sec-head reveal">
                <span className="lp2-eyebrow">{kickers.management}</span>
                <h2 style={{ whiteSpace: "pre-line" }}>{sectionTitles.management}</h2>
                <p>
                  {getCmsValue(
                    "management",
                    "subtext",
                    "Concord는 학부모님과 정기적으로 소통합니다. 진도, 숙제, 질문, 리포트를 한 흐름으로 연결합니다.",
                  )}
                </p>
              </div>

              <div className="lp2-care-list">
                {managementItems.map((item) => (
                  <div key={item.n} className="lp2-care-row reveal">
                    <div className="num">0{item.n}</div>
                    <div>
                      <h3>{item.label}</h3>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lp2-care-mock reveal" aria-hidden="true">
              <div className="lp2-report-card">
                <div className="lp2-report-head">
                  <span className="lp2-proof-dot" />
                  <strong>Concord 학습 리포트</strong>
                  <span className="t">6월 리포트</span>
                </div>
                <div className="lp2-report-body">
                  <div className="lp2-report-row">
                    <span className="k">이달 진도</span>
                    <span className="v">이차함수 그래프 활용 (교재 p.84~91)</span>
                  </div>
                  <div className="lp2-report-row">
                    <span className="k">숙제</span>
                    <span className="v">유형 연습 12문항 · 오답노트 3개</span>
                  </div>
                  <div className="lp2-report-row">
                    <span className="k">선생님 코멘트</span>
                    <span className="v">
                      응용 문제에 접근하는 방식이 눈에 띄게 좋아졌습니다. 다음 달은
                      실수 유형을 함께 줄여보겠습니다.
                    </span>
                  </div>
                </div>
                <div className="lp2-report-foot">매월 학습 리포트로 정리해 학부모님께 전달됩니다</div>
              </div>

              <div className="lp2-qna-card">
                <div className="lp2-report-head">
                  <span className="lp2-proof-dot" />
                  <strong>질문·답변</strong>
                  <span className="t">수업 없는 날에도</span>
                </div>
                <div className="lp2-qna-body">
                  <div className="lp2-bubble student">
                    <span className="who">학생 · 밤 11:24</span>
                    <p>쌤, 오늘 숙제 12번이요… 판별식으로 풀었는데 답이 왜 다르죠?</p>
                  </div>
                  <div className="lp2-bubble teacher">
                    <span className="who">선생님 · 아침 7:40</span>
                    <p>범위 조건을 빼먹었어요. 풀이 써서 보낼게요 — 다음 수업 때 같은 유형 한 번 더 봐요.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 7. RESULTS + REVIEWS ══════════════════════════ */}
      <section id="results" className="lp2-sec lp2-rev-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">Results</span>
            <h2>
              <CmsEdit active={isEditMode} section="results" cmsKey="section_title" type="text">
                {getCmsValue("results", "section_title", "결과로 증명합니다")}
              </CmsEdit>
            </h2>
          </div>
        </div>

        {doubledResults.length > 0 && (
          <div className="lp2-result-marquee">
            <div className="lp2-result-track">
              {doubledResults.map((item, i) => {
                const n = (i % cmsResults.length) + 1;
                const isOriginal = i < cmsResults.length;
                return (
                  <article key={i} className="lp2-result-card">
                    <div className="lp2-result-img">
                      {isOriginal ? (
                        <CmsEdit active={isEditMode} section="results" cmsKey={`result${n}_image`} type="image">
                          <Image
                            src={item.image}
                            alt={`${item.student} 성적 변화`}
                            fill
                            sizes="220px"
                            className="object-cover"
                          />
                        </CmsEdit>
                      ) : (
                        <Image
                          src={item.image}
                          alt={`${item.student} 성적 변화`}
                          fill
                          sizes="220px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="lp2-result-body">
                      <div className="lp2-result-meta">
                        <span className="lp2-result-badge">
                          {isOriginal ? (
                            <CmsEdit active={isEditMode} section="results" cmsKey={`result${n}_student`} type="text">
                              {item.student}
                            </CmsEdit>
                          ) : item.student}
                        </span>
                        <span className="lp2-result-months">
                          {isOriginal ? (
                            <CmsEdit active={isEditMode} section="results" cmsKey={`result${n}_months`} type="text">
                              {item.months} 수강
                            </CmsEdit>
                          ) : `${item.months} 수강`}
                        </span>
                      </div>
                      <p className="lp2-result-text">
                        {isOriginal ? (
                          <CmsEdit active={isEditMode} section="results" cmsKey={`result${n}_before`} type="text">
                            <span className="before">{item.before}</span>
                          </CmsEdit>
                        ) : <span className="before">{item.before}</span>}
                        <span className="arr">→</span>
                        {isOriginal ? (
                          <CmsEdit active={isEditMode} section="results" cmsKey={`result${n}_after`} type="text">
                            <span className="after">{item.after}</span>
                          </CmsEdit>
                        ) : <span className="after">{item.after}</span>}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal" style={{ marginTop: 56 }}>
            <span className="lp2-eyebrow">{kickers.reviews}</span>
            <h2>{sectionTitles.reviews}</h2>
          </div>

          <div className="lp2-rev-scroll reveal" role="list">
            {cmsTestimonials.map((t, i) => (
              <div key={i} className="lp2-rev-card" role="listitem">
                {t.gradeFrom && t.gradeTo ? (
                  <div
                    className="lp2-rev-grade"
                    aria-label={`${t.gradeFrom}에서 ${t.gradeTo}로 향상`}
                  >
                    <span className="from">{t.gradeFrom}</span>
                    <span className="arrow" aria-hidden="true">→</span>
                    <span className="to">{t.gradeTo}</span>
                  </div>
                ) : (
                  <div className="quote">&ldquo;</div>
                )}
                <p className="qt">{t.quote}</p>
                <div className="by">{t.info}</div>
              </div>
            ))}
          </div>

          <div className="lp2-cta-row" style={{ marginTop: 40 }}>
            <Link href="/reviews" className="lp2-btn lp2-btn-ghost lp2-btn-sm">
              후기 전체 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 8. PRICING ════════════════════════════════════ */}
      <section id="pricing" className="lp2-sec lp2-price-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">{kickers.plans}</span>
            <h2 style={{ whiteSpace: "pre-line" }}>{sectionTitles.plans}</h2>
            <p>{sectionTitles.plansSubtext}</p>
          </div>

          <div className="tier-tabs reveal" role="group" aria-label="학년 선택" style={{ margin: "0 auto 28px", justifyContent: "center" }}>
            <button
              type="button"
              className={tier === "middle" ? "on" : undefined}
              onClick={() => setTier("middle")}
            >
              중등
            </button>
            <button
              type="button"
              className={tier === "high" ? "on" : undefined}
              onClick={() => setTier("high")}
            >
              고등
            </button>
          </div>

          <div data-tier={tier} className="reveal">
            <PricingPlanCards items={pricingItems} tier={tier} sourcePrefix="home_pricing" />
          </div>

          <div className="lp2-cta-row" style={{ marginTop: 36 }}>
            <Link href="/pricing" className="lp2-btn lp2-btn-ghost">
              요금 자세히 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 9. FAQ + FINAL CTA ════════════════════════════ */}
      {cms?.faqs && cms.faqs.length > 0 && (
        <section id="faq" className="lp2-sec" style={{ scrollMarginTop: "80px" }}>
          <div className="lp2-wrap">
            <div className="lp2-sec-head reveal">
              <span className="lp2-eyebrow">FAQ</span>
              <h2>자주 묻는 질문</h2>
            </div>

            <div className="lp2-faq-list reveal">
              {cms.faqs.slice(0, 5).map((item, i) => (
                <details key={`${i}-${item.q}`} className="lp2-faq-item">
                  <summary>
                    <span className="lp2-faq-q">{item.q}</span>
                    <span className="lp2-faq-ind" aria-hidden="true">+</span>
                  </summary>
                  <p className="lp2-faq-a">{item.a}</p>
                </details>
              ))}
            </div>

            <div style={{ marginTop: 32 }}>
              <Link href="/faq" className="lp2-btn lp2-btn-ghost lp2-btn-sm">
                FAQ 전체 보기 →
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="lp2-sec">
        <div className="lp2-wrap">
          <div className="lp2-cta-band reveal">
            <div>
              <h2 style={{ whiteSpace: "pre-line" }}>
                {getCmsValue("cta", "headline", "판단은 첫 수업을 보고 하셔도 됩니다.")}
              </h2>
              <p>
                {getCmsValue("cta", "subtext", "결정은 천천히, 진단은 먼저 받아보세요.")}
              </p>
            </div>
            <ConsultationApplyButton className="lp2-btn" source="home_cta_band">
              {getCmsValue("cta", "button", "지금 무료 상담 신청하기")}
            </ConsultationApplyButton>
          </div>
        </div>
      </section>
    </div>
  );
}
