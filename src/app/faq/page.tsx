import { notFound } from "next/navigation";

import { FaqPageContent } from "@/components/faq/FaqPageContent";
import { getFaqPageFaqs } from "@/lib/cms";
import { isPublicSectionVisible } from "@/lib/cms-page-defaults";
import { FAQ_HTML_FALLBACK } from "@/lib/faq-html-fallback";
import { startPerfTimer } from "@/lib/perf-timer";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

export const revalidate = 300;

export const metadata = {
  title: "자주 묻는 질문",
};

type SearchParams = { cms_edit?: string | string[] };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function FaqPage({ searchParams }: { searchParams?: SearchParams }) {
  const timer = startPerfTimer("page.faq.total");
  const isEditMode = first(searchParams?.cms_edit) === "1";
  const [siteContent, faqs] = await Promise.all([
    getGroupedSiteContentBySections(["faq_page", "spacing"]),
    getFaqPageFaqs(),
  ]);
  if (!isPublicSectionVisible(siteContent, "faq_page", "show_page", true)) {
    timer.end({ notFound: true });
    notFound();
  }

  const page = (
    <FaqPageContent
      faqs={faqs.length > 0 ? faqs : [...FAQ_HTML_FALLBACK]}
      siteContent={siteContent}
      isEditMode={isEditMode}
    />
  );
  timer.end({ faqCount: faqs.length });
  return page;
}
