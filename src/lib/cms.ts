import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  FAQS_CACHE_TAG,
  PUBLIC_CMS_REVALIDATE_SECONDS,
  TESTIMONIALS_CACHE_TAG,
} from "@/lib/public-cms-cache";
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

const EMPTY_LANDING_CMS: LandingCmsContent = {
  siteContent: {},
  testimonials: [],
  faqs: [],
};

const getCachedActiveTestimonials = unstable_cache(
  async (): Promise<LandingCmsContent["testimonials"]> => {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { quote: true, author: true, imageUrl: true },
    });

    return testimonials.map((item) => ({
      quote: item.quote,
      info: item.author,
      img:
        item.imageUrl ||
        "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=640&h=520&fit=crop&q=80",
    }));
  },
  ["public-testimonials"],
  {
    revalidate: PUBLIC_CMS_REVALIDATE_SECONDS,
    tags: [TESTIMONIALS_CACHE_TAG],
  },
);

const getCachedActiveFaqs = unstable_cache(
  async (): Promise<LandingCmsContent["faqs"]> => {
    const faqs = await prisma.faqItem.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { question: true, answer: true },
    });

    return faqs.map((item) => ({ q: item.question, a: item.answer }));
  },
  ["public-faqs"],
  {
    revalidate: PUBLIC_CMS_REVALIDATE_SECONDS,
    tags: [FAQS_CACHE_TAG],
  },
);

export async function getActiveTestimonials(): Promise<LandingCmsContent["testimonials"]> {
  try {
    return await getCachedActiveTestimonials();
  } catch (error) {
    console.error("[getActiveTestimonials]", error);
    return [];
  }
}

export async function getActiveFaqs(): Promise<LandingCmsContent["faqs"]> {
  try {
    return await getCachedActiveFaqs();
  } catch (error) {
    console.error("[getActiveFaqs]", error);
    return [];
  }
}

/** connection_limit=1 환경: 병렬 Prisma 호출 금지, siteContent는 getGroupedSiteContent 재사용 */
export async function getLandingCmsContent(): Promise<LandingCmsContent> {
  try {
    const siteContent = await getGroupedSiteContent();
    const testimonials = await getActiveTestimonials();
    const faqs = await getActiveFaqs();

    return {
      siteContent,
      testimonials,
      faqs,
    };
  } catch (error) {
    console.error("[getLandingCmsContent]", error);
    return EMPTY_LANDING_CMS;
  }
}
