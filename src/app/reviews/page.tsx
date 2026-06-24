import { notFound } from "next/navigation";

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

export default async function ReviewsPage() {
  const timer = startPerfTimer("page.reviews.total");
  const siteContent = await getGroupedSiteContentBySections(["reviews_page", "spacing"]);
  if (!isPublicSectionVisible(siteContent, "reviews_page", "show_page", true)) {
    timer.end({ notFound: true });
    notFound();
  }

  const testimonials = await getReviewsPageTestimonials();

  const items: ReviewCardItem[] =
    testimonials.length > 0
      ? testimonials.map((t) => ({ quote: t.quote, info: t.info }))
      : [...REVIEWS_HTML_FALLBACK];

  const page = <ReviewsPageContent testimonials={items} />;
  timer.end({ testimonialCount: items.length });
  return page;
}
