"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import type { LandingCmsContent } from "@/lib/cms";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { CountUpStat } from "@/components/common/CountUpStat";
import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import {
  formatCmsMultiline,
  getFeaturedTutorCards,
  parseCmsVisibility,
} from "@/lib/cms-page-defaults";
import { buildVisibleCompareRows, getCompareTableTitle } from "@/lib/compare-cms";
import { useConsultationCta } from "@/hooks/useConsultationCta";
import { RESULT_CARD_IMAGES } from "@/lib/result-card-images";

/* ─── static fallback data ─── */
const DEFAULT_RESULT_IMAGES = [...RESULT_CARD_IMAGES];

const stats = [
  { value: "1,200+", label: "누적 상담" },
  { value: "500+", label: "매칭 완료" },
  { value: "98%", label: "학생 만족도" },
  { value: "4.9", label: "상담 평점" },
];

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
  { number: "02", title: "매니저 배정·전화 상담", desc: "10년 경력 매니저가 학습 상황과 가족의 우선순위를 듣습니다." },
  { number: "03", title: "선생님 추천·매칭", desc: "과목, 성향, 일정에 맞는 선생님 후보를 추천합니다." },
  { number: "04", title: "수업 시작", desc: "첫 수업 후 적합도를 확인하고 필요한 조정을 진행합니다. 불만족 시 100% 환불해드립니다." },
  { number: "05", title: "학습 리포트·관리", desc: "진도, 숙제, 질문, 리포트를 한 흐름으로 관리합니다." },
];

const assuranceItems = [
  {
    n: "01",
    title: "깐깐하게 선별합니다",
    desc: "서류·학력 인증, 수업 시연, 대면 인터뷰까지. 지원자 절반이 탈락하는 선발을 통과한 선생님만 소개합니다.",
  },
  {
    n: "02",
    title: "전문적으로 매칭합니다",
    desc: "성적표 위 숫자만 보지 않습니다. 학생의 성향과 목표, 공부 습관까지 듣고 가장 잘 가르칠 선생님을 찾습니다.",
  },
  {
    n: "03",
    title: "매칭 후에도 관리합니다",
    desc: "좋은 수업을 위해 매칭 이후에도 꾸준한 모니터링과 피드백으로 수업 퀄리티를 약속드립니다.",
  },
];

const heroTrustPills = [
  "무료 상담 1회",
  "전담 매니저 직접 상담",
  "서울·분당 방문 수업",
  "첫 수업 100% 환불 보장",
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
function homePricingTitleParts(raw: string): { highlight: string; suffix: string } {
  const line = (raw.includes("\n") ? raw.split("\n").pop() : raw)?.trim() ?? "월 38만원부터";
  const trimmed = line.replace(/^1:1\s*맞춤\s*과외,?\s*/, "").trim() || "월 38만원부터";
  if (trimmed.endsWith("부터")) {
    return { highlight: trimmed.slice(0, -2).trim(), suffix: "부터" };
  }
  return { highlight: trimmed, suffix: "" };
}

function buildLandingCmsView(cms?: LandingCmsContent) {
  const getCmsValue = (section: string, key: string, fallback: string) =>
    cms?.siteContent[section]?.[key] ?? fallback;
  const getCmsMultiline = (section: string, key: string, fallback: string) =>
    formatCmsMultiline(getCmsValue(section, key, fallback));

  const pricingTitleParts = homePricingTitleParts(
    getCmsValue("home_page", "pricing_title", "월 38만원부터"),
  );

  const cmsStats = stats.map((s, index) => {
    const n = index + 1;
    return {
      value: getCmsValue("stats", `stat${n}_number`, s.value),
      label: getCmsValue("stats", `stat${n}_label`, s.label),
    };
  });
  const statsFootnote = getCmsValue("stats", "footnote", "* 서비스 운영 데이터 기준");

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
      ? cms.testimonials.slice(0, 4)
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
          {
            quote:
              "선생님께 직접 말하기 어려운 요청도 매니저님께 전하면 다음 수업에 바로 반영돼요. 아이가 수업에 빨리 적응했어요.",
            info: "중2 수학 · 학부모",
            img: "",
          },
        ];

  const kickers = {
    assurance: getCmsValue("home_labels", "kicker_assurance", "Responsibility"),
    teachers: getCmsValue("home_labels", "kicker_teachers", "Teachers"),
    management: getCmsValue("home_labels", "kicker_management", "Learning Care"),
    process: getCmsValue("home_labels", "kicker_process", "Process"),
    plans: getCmsValue("home_labels", "kicker_plans", "Plans"),
    compare: getCmsValue("compare", "kicker", "Compare"),
    reviews: getCmsValue("home_labels", "kicker_reviews", "Reviews"),
    numbers: getCmsValue("home_labels", "kicker_numbers", "Numbers"),
  };

  const sectionTitles = {
    assurance: getCmsMultiline(
      "assurance",
      "section_title",
      "선생님 선별부터 매칭, 관리까지\nConcord가 책임집니다",
    ),
    assuranceSubtext: getCmsValue(
      "assurance",
      "section_subtext",
      "좋은 과외는 좋은 선생님에서 끝나지 않습니다. 선별, 매칭, 그 이후의 관리까지가 저희의 일입니다.",
    ),
    management: getCmsMultiline("management", "headline", "아이가 말해주지 않아도,\n아실 수 있습니다"),
    process: getCmsValue("features", "section_title", "이렇게 진행됩니다"),
    processSubtext: getCmsValue("features", "section_subtext", "상담부터 매칭, 수업까지 1:1로 학생의 성장에 집중해요."),
    teachers: getCmsMultiline("tutors_featured", "home_title", "이달의 검증 선생님"),
    teachersSubtext: getCmsValue(
      "tutors_featured",
      "home_subtext",
      "지원자 절반이 탈락하는 선발을 통과한 선생님만 소개합니다. 마음에 드는 선생님으로 상담을 신청하시면 매니저가 매칭을 도와드립니다.",
    ),
    reviews: getCmsValue("home_labels", "section_title_reviews", "실제 학부모님들의 이야기를 확인해보세요"),
    numbers: getCmsValue("stats", "section_title", "숫자로 보는 Concord"),
    consultBridge: getCmsMultiline(
      "consult_bridge",
      "headline",
      "사교육, 당장 결정이 어렵다면?\n무료 학습컨설팅부터 가볍게 받아보세요",
    ),
    consultBridgeSubtext: getCmsValue(
      "consult_bridge",
      "subtext",
      "아이마다 필요한 학습 전략이 다릅니다. 오직 우리 아이 맞춤으로 세워지는 학습 전략, 더 이상의 시간 낭비는 그만.",
    ),
    consultBridgeCta: getCmsValue("consult_bridge", "cta_label", "30초, 상담신청 남기기"),
    refund: getCmsMultiline("refund_band", "headline", "첫 수업 후 불만족 시\n100% 환불 보장"),
    refundSubtext: getCmsValue(
      "refund_band",
      "subtext",
      "자신있게 제안합니다. 상담 후 첫 수업까지만 받아보세요.",
    ),
    pricingAnchor: getCmsValue("home_page", "pricing_anchor_title", "맞춤수업부터 관리까지, 이 모든 게"),
  };

  return {
    getCmsValue,
    getCmsMultiline,
    pricingTitleParts,
    cmsStats,
    statsFootnote,
    cmsResults,
    doubledResults,
    cmsSteps,
    managementItems,
    cmsTestimonials,
    featuredTutors: getFeaturedTutorCards(cms?.siteContent).slice(0, 3),
    compareTitle: getCompareTableTitle(cms?.siteContent),
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

  const {
    getCmsValue,
    getCmsMultiline,
    pricingTitleParts,
    cmsStats,
    statsFootnote,
    cmsResults,
    doubledResults,
    cmsSteps,
    managementItems,
    cmsTestimonials,
    featuredTutors,
    compareTitle,
    kickers,
    sectionTitles,
  } = useMemo(() => buildLandingCmsView(cms), [cms]);

  const compareRowsCms = useMemo(
    () => buildVisibleCompareRows(cms?.siteContent),
    [cms?.siteContent],
  );

  return (
    <div className="lp2-root">
      {/* ══ HERO ══════════════════════════════════════════ */}
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
              <div className="lp2-hero-pills" aria-label="핵심 안내">
                {heroTrustPills.map((pill) => (
                  <span key={pill} className="lp2-hero-pill">
                    {pill}
                  </span>
                ))}
              </div>
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
              <div className="lp2-hero-proof">
                <div className="lp2-proof-card lp2-proof-match">
                  <div className="lp2-proof-head">
                    <span className="lp2-proof-dot" />
                    선생님 매칭 완료
                  </div>
                  <div className="lp2-proof-match-body">
                    <div className="lp2-proof-avatar">N</div>
                    <div>
                      <div className="lp2-proof-name">Teacher Noah</div>
                      <div className="lp2-proof-sub">서울대 수리과학부 · 수학</div>
                    </div>
                  </div>
                  <div className="lp2-proof-tags">
                    <span>주 2회 · 회당 2시간</span>
                    <span>대면 수업</span>
                  </div>
                </div>
                <div className="lp2-proof-card lp2-proof-score">
                  <span className="s-before">수학 5등급</span>
                  <span className="s-arr">→</span>
                  <span className="s-after">2등급</span>
                  <span className="s-months">3개월</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ASSURANCE (선별→매칭→관리 책임) ═══════════════ */}
      <section id="assurance" className="lp2-sec lp2-assure-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">{kickers.assurance}</span>
            <h2 style={{ whiteSpace: "pre-line" }}>{sectionTitles.assurance}</h2>
            <p>{sectionTitles.assuranceSubtext}</p>
          </div>

          <div className="lp2-grid-3">
            {assuranceItems.map((item, index) => (
              <div key={item.n} className="lp2-care-card reveal">
                <div className="num">{item.n}</div>
                <h3>{getCmsValue("assurance", `item${index + 1}_title`, item.title)}</h3>
                <p>{getCmsMultiline("assurance", `item${index + 1}_desc`, item.desc)}</p>
              </div>
            ))}
          </div>

          <p className="lp2-verify-lead reveal">
            모든 선생님은 3단계 검증을 통과합니다
          </p>
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
        </div>
      </section>

      {/* ══ PROMISE ═══════════════════════════════════════ */}
      <section id="promise" className="lp2-sec lp2-promise-sec" style={{ scrollMarginTop: "80px" }}>
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">Our Promise</span>
            <h2>
              선생님이 맞지 않으면
              <br />
              어떡하죠?
            </h2>
            <p>
              가장 많이 받는 질문입니다. Concord는 학생이 잘 맞는 선생님을 만날
              때까지 끝까지 책임집니다.
            </p>
          </div>

          <div className="lp2-grid-3">
            {[
              {
                n: "01",
                title: "추가 비용 없는 재매칭",
                desc: "첫 배정 선생님이 맞지 않으면, 추가 비용 없이 다시 찾아드립니다. 맞는 선생님을 만날 때까지가 저희의 일입니다.",
              },
              {
                n: "02",
                title: "첫 수업 100% 환불",
                desc: "첫 수업 후 마음에 들지 않으면 위약 조건 없이 전액 환불해드립니다. 판단은 수업을 본 뒤에 하셔도 됩니다.",
              },
              {
                n: "03",
                title: "전담 매니저가 중간에서",
                desc: "선생님께 직접 말하기 어려운 요청은 매니저에게 전하세요. 수업에 반영되도록 저희가 조율합니다.",
              },
            ].map((item) => (
              <div key={item.n} className="lp2-promise-card reveal">
                <div className="num">{item.n}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LEARNING CARE · 학부모 소통 ════════════════════ */}
      <section
        id="management"
        className="lp2-sec"
        style={{ scrollMarginTop: "80px" }}
      >
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

      {/* ══ CONSULT BRIDGE (무료 학습컨설팅) ═══════════════ */}
      <section className="lp2-sec lp2-band-sec">
        <div className="lp2-wrap">
          <div className="lp2-consult-band reveal">
            <span className="lp2-eyebrow">Free Consulting</span>
            <h2 style={{ whiteSpace: "pre-line" }}>{sectionTitles.consultBridge}</h2>
            <p>{sectionTitles.consultBridgeSubtext}</p>
            <ConsultationApplyButton className="lp2-btn lp2-btn-acc" source="home_consult_bridge">
              {sectionTitles.consultBridgeCta}
            </ConsultationApplyButton>
          </div>
        </div>
      </section>

      {/* ══ REFUND BAND (100% 환불 보장) ═══════════════════ */}
      <section className="lp2-sec lp2-refund-sec">
        <div className="lp2-wrap">
          <div className="lp2-refund-band reveal">
            <div>
              <h2 style={{ whiteSpace: "pre-line" }}>{sectionTitles.refund}</h2>
              <p>{sectionTitles.refundSubtext}</p>
            </div>
            <ConsultationApplyButton className="lp2-btn lp2-refund-btn" source="home_refund_band">
              부담 없이 상담받기
            </ConsultationApplyButton>
          </div>
        </div>
      </section>

      {/* ══ RESULTS ══════════════════════════════════════ */}
      {doubledResults.length > 0 && (
        <section className="lp2-sec lp2-results-sec" id="results" style={{ scrollMarginTop: "80px" }}>
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
        </section>
      )}

      {/* ══ FEATURED TEACHERS (이달의 검증 선생님 미리보기) ═ */}
      <section
        id="teachers"
        className="lp2-sec"
        style={{ scrollMarginTop: "80px" }}
      >
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">{kickers.teachers}</span>
            <h2 style={{ whiteSpace: "pre-line" }}>{sectionTitles.teachers}</h2>
            <p>{sectionTitles.teachersSubtext}</p>
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

      {/* ══ REVIEWS (학부모 후기 캐러셀) ═══════════════════ */}
      <section
        id="reviews"
        className="lp2-sec lp2-rev-sec"
        style={{ scrollMarginTop: "80px" }}
      >
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">{kickers.reviews}</span>
            <h2>{sectionTitles.reviews}</h2>
          </div>

          <div className="lp2-rev-scroll reveal" role="list">
            {cmsTestimonials.map((t, i) => (
              <div key={i} className="lp2-rev-card" role="listitem">
                <div className="quote">&ldquo;</div>
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

      {/* ══ NUMBERS (누적 통계 카운터) ═════════════════════ */}
      <section className="lp2-sec lp2-counter-sec">
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">{kickers.numbers}</span>
            <h2>{sectionTitles.numbers}</h2>
          </div>
          <div className="lp2-stats reveal">
            {cmsStats.map((s) => (
              <div key={s.label} className="lp2-stat">
                <div className="n">
                  <CountUpStat value={s.value} />
                </div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="lp2-stats-note reveal">{statsFootnote}</p>
        </div>
      </section>

      {/* ══ PROCESS ═══════════════════════════════════════ */}
      <section
        id="process"
        className="lp2-sec"
        style={{ scrollMarginTop: "80px" }}
      >
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

      {/* ══ PRICING ANCHOR ════════════════════════════════ */}
      <section
        id="pricing"
        className="lp2-sec lp2-price-anchor-sec"
        style={{ scrollMarginTop: "80px" }}
      >
        <div className="lp2-wrap">
          <div className="lp2-price-anchor reveal">
            <span className="lp2-eyebrow">{kickers.plans}</span>
            <h2>{sectionTitles.pricingAnchor}</h2>
            <div className="lp2-price-anchor-num">
              <span className="lp2-hl">{pricingTitleParts.highlight}</span>
              <em>{pricingTitleParts.suffix}</em>
            </div>
            <p>
              {getCmsValue(
                "home_page",
                "pricing_subtext",
                "학습 리포트·매니저 관리·강사 첨삭이 모두 포함된 금액입니다. 정확한 요금은 상담에서 아이에 맞춰 안내드립니다.",
              )}
            </p>
            <p className="lp2-price-anchor-note">상담 신청은 30초면 충분합니다</p>
            <div className="lp2-cta-row lp2-price-anchor-cta">
              <ConsultationApplyButton className="lp2-btn lp2-btn-acc" source="home_pricing_anchor">
                무료 상담 신청
              </ConsultationApplyButton>
              <Link href="/pricing" className="lp2-btn lp2-btn-ghost">
                요금 자세히 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ COMPARE ═══════════════════════════════════════ */}
      <section
        id="compare"
        className="lp2-sec"
        style={{ scrollMarginTop: "80px" }}
      >
        <div className="lp2-wrap">
          <div className="lp2-sec-head reveal">
            <span className="lp2-eyebrow">{kickers.compare}</span>
            <h2>
              <CmsEdit active={isEditMode} section="compare" cmsKey="table_title" type="text">
                {compareTitle || "개인 과외와 무엇이 다른가요"}
              </CmsEdit>
            </h2>
            <p>
              맞지 않는 선생님으로 1~2달을 낭비하지 않도록, 처음부터 핏을 맞춥니다.
            </p>
          </div>

          <div className="lp2-cmp-wrap reveal">
            <table className="lp2-cmp">
              <thead>
                <tr>
                  <th>비교 항목</th>
                  <th>개인 과외</th>
                  <th className="lp2-col-c lp2-cc">Concord</th>
                </tr>
              </thead>
              <tbody>
                {compareRowsCms.map((row) => (
                  <tr key={row.rowIndex}>
                    <td>
                      <CmsEdit active={isEditMode} section="compare" cmsKey={`row${row.rowIndex}_feature`} type="text">
                        {row.feature}
                      </CmsEdit>
                    </td>
                    <td>
                      {row.other === "✗" || row.other === "없음" ? (
                        <>
                          <span className="lp2-no">✗</span>
                          {row.other.replace("✗", "").trim() || "없음"}
                        </>
                      ) : (
                        <CmsEdit active={isEditMode} section="compare" cmsKey={`row${row.rowIndex}_other`} type="text">
                          {row.other}
                        </CmsEdit>
                      )}
                    </td>
                    <td className="lp2-col-c">
                      <span className="lp2-ok">✓</span>
                      <CmsEdit active={isEditMode} section="compare" cmsKey={`row${row.rowIndex}_concord`} type="text">
                        {row.concord.replace(/^✓\s*/, "")}
                      </CmsEdit>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════ */}
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

      {/* ══ CTA BAND ══════════════════════════════════════ */}
      <section className="lp2-sec">
        <div className="lp2-wrap">
          <div className="lp2-cta-band reveal">
            <div>
              <h2>
                {getCmsValue(
                  "cta",
                  "headline",
                  "첫 수업이 마음에 안 들면\n100% 환불해드립니다",
                )}
              </h2>
              <p>
                {getCmsValue(
                  "cta",
                  "subtext",
                  "무료 상담 1회 · 1~3일 내 선생님 배정 · 첫 수업 100% 환불 보장",
                )}
              </p>
            </div>
            <ConsultationApplyButton className="lp2-btn" source="home_cta_band">
              지금 무료 상담 신청하기
            </ConsultationApplyButton>
          </div>
        </div>
      </section>
    </div>
  );
}
