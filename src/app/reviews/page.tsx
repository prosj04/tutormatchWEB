import { notFound } from "next/navigation";

import "./reviews.css";

import { ReviewsPageContent } from "@/components/reviews/ReviewsPageContent";
import { getReviewsPageTestimonials } from "@/lib/cms";
import { isPublicSectionVisible } from "@/lib/cms-page-defaults";
import { REVIEWS_HTML_FALLBACK, type ReviewCardItem } from "@/lib/reviews-html-fallback";
import { startPerfTimer } from "@/lib/perf-timer";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

export const revalidate = 300;

export const metadata = {
  title: "후기",
};

type SearchParams = { cms_edit?: string | string[] };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ReviewsPage(props: { searchParams?: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const timer = startPerfTimer("page.reviews.total");
  const isEditMode = first(searchParams?.cms_edit) === "1";
  const [siteContent, testimonials] = await Promise.all([
    getGroupedSiteContentBySections(["reviews_page", "reviews_success", "reviews_proof", "hall", "spacing"]),
    getReviewsPageTestimonials(),
  ]);
  if (!isPublicSectionVisible(siteContent, "reviews_page", "show_page", true)) {
    timer.end({ notFound: true });
    notFound();
  }

  const items: ReviewCardItem[] =
    testimonials.length > 0
      ? testimonials.map((t) => ({
          quote: t.quote,
          info: t.info,
          ...(t.gradeFrom ? { gradeFrom: t.gradeFrom } : {}),
          ...(t.gradeTo ? { gradeTo: t.gradeTo } : {}),
          ...(t.category ? { category: t.category } : {}),
          ...(t.tags && t.tags.length > 0 ? { tags: t.tags } : {}),
        }))
      : [...REVIEWS_HTML_FALLBACK];

  const page = (
    <ReviewsPageContent testimonials={items} siteContent={siteContent} isEditMode={isEditMode} />
  );
  timer.end({ testimonialCount: items.length });
  return page;
}
