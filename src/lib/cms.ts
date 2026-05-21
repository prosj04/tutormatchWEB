import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { getGroupedSiteContent } from "@/lib/site-content";

export type LandingCmsContent = {
  siteContent: Record<string, Record<string, string>>;
  testimonials: Array<{
    quote: string;
    info: string;
    img: string;
  }>;
  faqs: Array<{
    q: string;
    a: string;
  }>;
};

/** connection_limit=1 환경: 병렬 Prisma 호출 금지, siteContent는 getGroupedSiteContent 재사용 */
export const getLandingCmsContent = cache(async (): Promise<LandingCmsContent> => {
  const siteContent = await getGroupedSiteContent();
  const testimonials = await prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { quote: true, author: true, imageUrl: true },
  });
  const faqs = await prisma.faqItem.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { question: true, answer: true },
  });

  return {
    siteContent,
    testimonials: testimonials.map((item) => ({
      quote: item.quote,
      info: item.author,
      img:
        item.imageUrl ||
        "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=640&h=520&fit=crop&q=80",
    })),
    faqs: faqs.map((item) => ({ q: item.question, a: item.answer })),
  };
});
