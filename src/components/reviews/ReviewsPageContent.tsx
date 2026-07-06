import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ConcordSubpageCta } from "@/components/concord/ConcordSubpageCta";
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
        </div>
      </section>

      <ConcordSubpageCta
        title="우리 아이도 같은 변화를 경험할 수 있어요"
        description="무료 상담으로 학생에게 딱 맞는 학습 플랜을 확인해 보세요."
        source="reviews_page_cta"
      />
    </main>
  );
}
