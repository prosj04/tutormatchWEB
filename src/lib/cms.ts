import { prisma } from "@/lib/prisma";

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

export async function getLandingCmsContent(): Promise<LandingCmsContent> {
  const [rows, testimonials, faqs] = await Promise.all([
    prisma.siteContent.findMany({
      where: { isActive: true },
      orderBy: [{ section: "asc" }, { order: "asc" }],
      select: { section: true, key: true, value: true },
    }),
    prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { quote: true, author: true, imageUrl: true },
    }),
    prisma.faqItem.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { question: true, answer: true },
    }),
  ]);

  const siteContent: LandingCmsContent["siteContent"] = {};
  for (const row of rows) {
    siteContent[row.section] ??= {};
    siteContent[row.section][row.key] = row.value;
  }

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
}
