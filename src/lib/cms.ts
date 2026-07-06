import { unstable_cache } from "next/cache";

import { startPerfTimer, timeAsync } from "@/lib/perf-timer";
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
    gradeFrom?: string;
    gradeTo?: string;
    category?: string;
    tags?: string[];
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

function mapTestimonialRows(
  testimonials: Array<{
    quote: string;
    author: string;
    imageUrl: string | null;
    gradeFrom?: string | null;
    gradeTo?: string | null;
    category?: string | null;
    tags?: string | null;
  }>,
): LandingCmsContent["testimonials"] {
  return testimonials.map((item) => ({
    quote: item.quote,
    info: item.author,
    img:
      item.imageUrl ||
      "/images/photos/selfies/selfie-2.jpg",
    ...(item.gradeFrom ? { gradeFrom: item.gradeFrom } : {}),
    ...(item.gradeTo ? { gradeTo: item.gradeTo } : {}),
    ...(item.category ? { category: item.category } : {}),
    ...(item.tags
      ? { tags: item.tags.split("\n").map((t) => t.trim()).filter(Boolean) }
      : {}),
  }));
}

function mapFaqRows(faqs: Array<{ question: string; answer: string }>): LandingCmsContent["faqs"] {
  return faqs.map((item) => ({ q: item.question, a: item.answer }));
}

const getCachedHomeTestimonials = unstable_cache(
  async (): Promise<LandingCmsContent["testimonials"]> => {
    const testimonials = await timeAsync("prisma.testimonial.findMany.home", () =>
      prisma.testimonial.findMany({
        where: { isActive: true, showOnHome: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          quote: true,
          author: true,
          imageUrl: true,
          gradeFrom: true,
          gradeTo: true,
          category: true,
          tags: true,
        },
      }),
    );
    return mapTestimonialRows(testimonials);
  },
  ["public-testimonials-home"],
  {
    revalidate: PUBLIC_CMS_REVALIDATE_SECONDS,
    tags: [TESTIMONIALS_CACHE_TAG],
  },
);

const getCachedReviewsPageTestimonials = unstable_cache(
  async (): Promise<LandingCmsContent["testimonials"]> => {
    const testimonials = await timeAsync("prisma.testimonial.findMany.reviewsPage", () =>
      prisma.testimonial.findMany({
        where: { isActive: true, showOnReviewsPage: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          quote: true,
          author: true,
          imageUrl: true,
          gradeFrom: true,
          gradeTo: true,
          category: true,
          tags: true,
        },
      }),
    );
    return mapTestimonialRows(testimonials);
  },
  ["public-testimonials-reviews-page"],
  {
    revalidate: PUBLIC_CMS_REVALIDATE_SECONDS,
    tags: [TESTIMONIALS_CACHE_TAG],
  },
);

const getCachedHomeFaqs = unstable_cache(
  async (): Promise<LandingCmsContent["faqs"]> => {
    const faqs = await timeAsync("prisma.faqItem.findMany.home", () =>
      prisma.faqItem.findMany({
        where: { isActive: true, showOnHome: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { question: true, answer: true },
      }),
    );
    return mapFaqRows(faqs);
  },
  ["public-faqs-home"],
  {
    revalidate: PUBLIC_CMS_REVALIDATE_SECONDS,
    tags: [FAQS_CACHE_TAG],
  },
);

const getCachedFaqPageFaqs = unstable_cache(
  async (): Promise<LandingCmsContent["faqs"]> => {
    const faqs = await timeAsync("prisma.faqItem.findMany.faqPage", () =>
      prisma.faqItem.findMany({
        where: { isActive: true, showOnFaqPage: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { question: true, answer: true },
      }),
    );
    return mapFaqRows(faqs);
  },
  ["public-faqs-page"],
  {
    revalidate: PUBLIC_CMS_REVALIDATE_SECONDS,
    tags: [FAQS_CACHE_TAG],
  },
);

export async function getHomeTestimonials(): Promise<LandingCmsContent["testimonials"]> {
  try {
    return await getCachedHomeTestimonials();
  } catch (error) {
    console.error("[getHomeTestimonials]", error);
    return [];
  }
}

export async function getReviewsPageTestimonials(): Promise<LandingCmsContent["testimonials"]> {
  try {
    return await getCachedReviewsPageTestimonials();
  } catch (error) {
    console.error("[getReviewsPageTestimonials]", error);
    return [];
  }
}

export async function getHomeFaqs(): Promise<LandingCmsContent["faqs"]> {
  try {
    return await getCachedHomeFaqs();
  } catch (error) {
    console.error("[getHomeFaqs]", error);
    return [];
  }
}

export async function getFaqPageFaqs(): Promise<LandingCmsContent["faqs"]> {
  try {
    return await getCachedFaqPageFaqs();
  } catch (error) {
    console.error("[getFaqPageFaqs]", error);
    return [];
  }
}

/** @deprecated use getReviewsPageTestimonials */
export async function getActiveTestimonials(): Promise<LandingCmsContent["testimonials"]> {
  return getReviewsPageTestimonials();
}

/** @deprecated use getFaqPageFaqs */
export async function getActiveFaqs(): Promise<LandingCmsContent["faqs"]> {
  return getFaqPageFaqs();
}

/** connection_limit=1 환경: siteContent 먼저, testimonials·faqs는 캐시된 조회만 병렬 */
export async function getLandingCmsContent(): Promise<LandingCmsContent> {
  const timer = startPerfTimer("cms.getLandingCmsContent");
  try {
    const siteContent = await getGroupedSiteContent();
    const [testimonials, faqs] = await Promise.all([
      getHomeTestimonials(),
      getHomeFaqs(),
    ]);

    return {
      siteContent,
      testimonials,
      faqs,
    };
  } catch (error) {
    console.error("[getLandingCmsContent]", error);
    return EMPTY_LANDING_CMS;
  } finally {
    timer.end();
  }
}
