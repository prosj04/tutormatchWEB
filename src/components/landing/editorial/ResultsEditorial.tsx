"use client";

import Image from "next/image";
import Link from "next/link";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { HallOfFameCarousel, type HallItem } from "@/components/common/HallOfFameCarousel";
import { formatResultDuration, type LandingView } from "./landing-view";

/**
 * 성과(느린 마퀴) + 후기(합격 카드 + 헤어라인 3열 풀쿼트).
 * 사진은 원본 비율, 캡션은 small caps, 점수 변화는 세리프 숫자.
 */
export function ResultsEditorial({
  view,
  hallItems,
  isEditMode,
}: {
  view: LandingView;
  hallItems: HallItem[];
  isEditMode: boolean;
}) {
  const {
    getCmsValue,
    cmsResults,
    doubledResults,
    cmsTestimonials,
    kickers,
    sectionTitles,
    showReviews,
    uiLabels,
  } = view;

  return (
    <section id="results" className="sec ruled">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow reveal lx-fast">{kickers.results}</span>
          <div className="sec-head-body">
            <h2 className="h2 reveal lx-slow">
              <CmsEdit active={isEditMode} section="results" cmsKey="section_title" type="text">
                {getCmsValue("results", "section_title", "결과로 증명합니다")}
              </CmsEdit>
            </h2>
            <p className="caption reveal lx-fast" style={{ marginTop: 18 }}>
              <CmsEdit active={isEditMode} section="results" cmsKey="section_note" type="text">
                {getCmsValue("results", "section_note", "2026년 상반기 Concord 수강생 기준")}
              </CmsEdit>
            </p>
          </div>
        </div>
      </div>

      {doubledResults.length > 0 && (
        <div className="lx-marq">
          <div className="lx-marq-track">
            {doubledResults.map((item, i) => {
              const n = (i % cmsResults.length) + 1;
              const isOriginal = i < cmsResults.length;
              const duration = `${formatResultDuration(item.months)} ${uiLabels.resultMonthsSuffix}`;
              return (
                <article key={i} className="lx-res">
                  {item.image ? (
                    isOriginal ? (
                      <CmsEdit
                        active={isEditMode}
                        section="results"
                        cmsKey={`result${n}_image`}
                        type="image"
                      >
                        <Image
                          src={item.image}
                          alt={`${item.student} 성적 변화`}
                          width={480}
                          height={360}
                          sizes="240px"
                          style={{ width: "100%", height: "auto" }}
                        />
                      </CmsEdit>
                    ) : (
                      <Image
                        src={item.image}
                        alt={`${item.student} 성적 변화`}
                        width={480}
                        height={360}
                        sizes="240px"
                        style={{ width: "100%", height: "auto" }}
                      />
                    )
                  ) : null}
                  <div className="lx-res-cap">
                    <span>
                      {isOriginal ? (
                        <CmsEdit
                          active={isEditMode}
                          section="results"
                          cmsKey={`result${n}_student`}
                          type="text"
                        >
                          {item.student}
                        </CmsEdit>
                      ) : (
                        item.student
                      )}
                    </span>
                    <span>
                      {isOriginal ? (
                        <CmsEdit
                          active={isEditMode}
                          section="results"
                          cmsKey={`result${n}_months`}
                          type="text"
                        >
                          {duration}
                        </CmsEdit>
                      ) : (
                        duration
                      )}
                    </span>
                  </div>
                  <p className="lx-res-score">
                    {isOriginal ? (
                      <CmsEdit
                        active={isEditMode}
                        section="results"
                        cmsKey={`result${n}_before`}
                        type="text"
                      >
                        <span className="before">{item.before}</span>
                      </CmsEdit>
                    ) : (
                      <span className="before">{item.before}</span>
                    )}
                    <span className="lx-res-to">
                      <span className="arr" aria-hidden="true">
                        →
                      </span>{" "}
                      {isOriginal ? (
                        <CmsEdit
                          active={isEditMode}
                          section="results"
                          cmsKey={`result${n}_after`}
                          type="text"
                        >
                          <span className="after">{item.after}</span>
                        </CmsEdit>
                      ) : (
                        <span className="after">{item.after}</span>
                      )}
                    </span>
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {showReviews && (
        <div className="wrap" style={{ marginTop: "clamp(64px, 7vw, 112px)" }}>
          <div className="sec-head">
            <span className="eyebrow reveal lx-fast">{kickers.reviews}</span>
            <div className="sec-head-body">
              <h2 className="h2 reveal lx-slow">{sectionTitles.reviews}</h2>
            </div>
          </div>

          <div className="lx-hall reveal lx-fast">
            <HallOfFameCarousel items={hallItems} />
          </div>

          <div className="lx-quotes" role="list">
            {cmsTestimonials.map((t, i) => (
              <div
                key={i}
                className="lx-quote reveal lx-stag lx-fast"
                role="listitem"
                style={{ "--lx-i": i } as React.CSSProperties}
              >
                {t.img ? (
                  <div className="lx-quote-photo">
                    <Image
                      src={t.img}
                      alt={`${t.info} 사진`}
                      width={112}
                      height={140}
                      sizes="56px"
                      style={{ width: "100%", height: "auto" }}
                    />
                  </div>
                ) : null}
                {t.title ? (
                  <h3 className="lx-quote-t" style={{ whiteSpace: "pre-line" }}>
                    &ldquo;{t.title}&rdquo;
                  </h3>
                ) : null}
                <p className="lx-quote-q">{t.quote}</p>
                <div className="lx-quote-meta">
                  <span className="lx-quote-by">{t.info}</span>
                  {t.gradeFrom && t.gradeTo ? (
                    <span
                      className="lx-quote-grade"
                      aria-label={`${t.gradeFrom}에서 ${t.gradeTo}로 향상`}
                    >
                      <span className="from">{t.gradeFrom}</span>
                      <span className="arrow" aria-hidden="true">
                        →
                      </span>
                      <span className="to">{t.gradeTo}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {cmsTestimonials.some((t) => t.img) ? (
            <p className="lx-imgnote">*사진은 실제 후기 작성자와 다를 수 있습니다</p>
          ) : null}

          <p className="lx-more reveal lx-fast">
            <Link href="/reviews" className="link">
              {uiLabels.viewAllReviews.replace(/\s*→\s*$/, "")}
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
