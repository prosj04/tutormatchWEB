import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { formatCmsMultiline, getCmsSectionValue } from "@/lib/cms-page-defaults";
import { ReviewByLine, type ReviewCardItem } from "@/lib/reviews-html-fallback";
import type { GroupedSiteContent } from "@/lib/site-content";

function cmsTitleLines(text: string) {
  const lines = formatCmsMultiline(text).split("\n").filter(Boolean);
  if (lines.length <= 1) return text;
  return lines.map((line, i) => (
    <span key={line}>
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
      <ConcordPageHead
        eyebrow={
          <CmsEdit active={isEditMode} section="reviews_page" cmsKey="kicker" type="text">
            {get("kicker", "Reviews")}
          </CmsEdit>
        }
        title={
          <CmsEdit active={isEditMode} section="reviews_page" cmsKey="title" type="text">
            {cmsTitleLines(get("title", "성적보다 습관이\n먼저 바뀌었어요"))}
          </CmsEdit>
        }
        description={
          <CmsEdit active={isEditMode} section="reviews_page" cmsKey="subtext" type="text">
            {get(
              "subtext",
              "Concord와 함께한 가정의 실제 후기입니다. 성적 향상보다 학생이 스스로 공부하게 된 이야기를 더 자랑스럽게 생각합니다.",
            )}
          </CmsEdit>
        }
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="rev-masonry">
            {testimonials.map((item) => (
              <ConcordReveal key={`${item.info}-${item.quote.slice(0, 24)}`} as="article" className="card rev-card">
                <div className="rev-stars">★★★★★</div>
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
