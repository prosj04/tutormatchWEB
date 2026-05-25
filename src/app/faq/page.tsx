import { notFound } from "next/navigation";

import { FaqPageContent } from "@/components/faq/FaqPageContent";
import { getActiveFaqs } from "@/lib/cms";
import { isPublicSectionVisible } from "@/lib/cms-page-defaults";
import { LANDING_FAQ_FALLBACK } from "@/lib/faq-defaults";
import { getGroupedSiteContent } from "@/lib/site-content";

export const revalidate = 300;

export const metadata = {
  title: "자주 묻는 질문",
};

export default async function FaqPage() {
  const siteContent = await getGroupedSiteContent();
  if (!isPublicSectionVisible(siteContent, "faq_page", "show_page", true)) {
    notFound();
  }

  const faqs = await getActiveFaqs();

  return (
    <FaqPageContent
      faqs={faqs.length > 0 ? faqs : [...LANDING_FAQ_FALLBACK]}
      siteContent={siteContent}
    />
  );
}
