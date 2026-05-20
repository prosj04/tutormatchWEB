import { notFound } from "next/navigation";

import { FaqPageContent } from "@/components/faq/FaqPageContent";
import { getLandingCmsContent } from "@/lib/cms";
import { isPublicSectionVisible } from "@/lib/cms-page-defaults";
import { LANDING_FAQ_FALLBACK } from "@/lib/faq-defaults";
import { getGroupedSiteContent } from "@/lib/site-content";

export const revalidate = 60;

export const metadata = {
  title: "자주 묻는 질문",
};

export default async function FaqPage() {
  const [cms, siteContent] = await Promise.all([
    getLandingCmsContent(),
    getGroupedSiteContent(),
  ]);
  if (!isPublicSectionVisible(siteContent, "faq_page", "show_page", true)) {
    notFound();
  }

  const faqs = cms.faqs.length > 0 ? cms.faqs : [...LANDING_FAQ_FALLBACK];

  return <FaqPageContent faqs={faqs} siteContent={siteContent} />;
}
