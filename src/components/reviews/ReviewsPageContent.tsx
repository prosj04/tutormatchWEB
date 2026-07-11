"use client";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { formatCmsMultiline, getCmsSectionValue } from "@/lib/cms-page-defaults";
import { ReviewByLine, type ReviewCardItem } from "@/lib/reviews-html-fallback";
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

  return (
    <main>
      <section className="page-head">
        <div className="bg"></div>
        <div className="wrap inner">
          <span className="eyebrow">
            <CmsEdit active={isEditMode} section="reviews_page" cmsKey="hero_kicker" type="text">
              {get("hero_kicker", "Reviews")}
            </CmsEdit>
          </span>
          <h1>
            <CmsEdit active={isEditMode} section="reviews_page" cmsKey="hero_title" type="text">
              {multilineNodes(get("hero_title", "성적보다 습관이\n먼저 바뀌었어요"))}
            </CmsEdit>
          </h1>
          <p>
            <CmsEdit active={isEditMode} section="reviews_page" cmsKey="hero_subtext" type="text">
              {get(
                "hero_subtext",
                "Concord와 함께한 가정의 실제 후기입니다. 점수 변화보다 학생이 스스로 공부하게 된 이야기를 더 자랑스럽게 생각합니다.",
              )}
            </CmsEdit>
          </p>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="rev-masonry">
            {testimonials.map((item) => (
              <ConcordReveal
                key={`${item.info}-${item.quote.slice(0, 24)}`}
                as="article"
                className="card rev-card"
              >
                <div className="rev-stars">{"★".repeat(5)}</div>
                <p className="qt">{item.quote}</p>
                <ReviewByLine info={item.info} />
              </ConcordReveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
