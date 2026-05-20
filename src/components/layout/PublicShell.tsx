import { SiteHeader } from "@/components/landing/SiteHeader";
import { isPublicSectionVisible } from "@/lib/cms-page-defaults";
import { getGroupedSiteContent } from "@/lib/site-content";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const siteContent = await getGroupedSiteContent();
  const showFaqLink = isPublicSectionVisible(siteContent, "faq_page", "show_page", true);
  const showReviewsLink = isPublicSectionVisible(siteContent, "reviews_page", "show_page", true);

  return (
    <>
      <SiteHeader variant="light" showFaqLink={showFaqLink} showReviewsLink={showReviewsLink} />
      <div className="min-h-screen bg-background pt-16 md:pt-[100px]">{children}</div>
    </>
  );
}
