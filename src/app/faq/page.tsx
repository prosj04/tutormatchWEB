import { notFound } from "next/navigation";

import { FaqPageContent } from "@/components/faq/FaqPageContent";
import { getActiveFaqs } from "@/lib/cms";
import { isPublicSectionVisible } from "@/lib/cms-page-defaults";
import { LANDING_FAQ_FALLBACK } from "@/lib/faq-defaults";
import { startPerfTimer } from "@/lib/perf-timer";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

export const revalidate = 300;

export const metadata = {
  title: "자주 묻는 질문",
};

export default async function FaqPage() {
  const timer = startPerfTimer("page.faq.total");
  const siteContent = await getGroupedSiteContentBySections(["faq_page"]);
  if (!isPublicSectionVisible(siteContent, "faq_page", "show_page", true)) {
    timer.end({ notFound: true });
    notFound();
  }

  const faqs = await getActiveFaqs();

  const page = (
    <FaqPageContent
      faqs={faqs.length > 0 ? faqs : [...LANDING_FAQ_FALLBACK]}
      siteContent={siteContent}
    />
  );
  timer.end({ faqCount: faqs.length });
  return page;
}
