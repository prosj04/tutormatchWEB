import { notFound } from "next/navigation";

import { ReviewsPageContent } from "@/components/reviews/ReviewsPageContent";
import { getActiveTestimonials } from "@/lib/cms";
import { isPublicSectionVisible } from "@/lib/cms-page-defaults";
import { getGroupedSiteContent } from "@/lib/site-content";

export const revalidate = 300;

export const metadata = {
  title: "학습 후기",
};

const fallbackTestimonials = [
  {
    quote:
      "공부하러 가서도 시간만 보내던 아이가 처음으로 공부 계획을 직접 잡고 실행했어요.",
    info: "고2 수학 · 학부모",
    img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=640&h=520&fit=crop&q=80",
  },
];

export default async function ReviewsPage() {
  const siteContent = await getGroupedSiteContent();
  if (!isPublicSectionVisible(siteContent, "reviews_page", "show_page", true)) {
    notFound();
  }

  const testimonials = await getActiveTestimonials();

  return (
    <ReviewsPageContent
      testimonials={testimonials.length > 0 ? testimonials : fallbackTestimonials}
      siteContent={siteContent}
    />
  );
}
