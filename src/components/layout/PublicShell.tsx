import { ConcordSiteFooter } from "@/components/concord/ConcordSiteFooter";
import { ConcordSiteHeader } from "@/components/concord/ConcordSiteHeader";
import { PublicAppProviders } from "@/components/providers/PublicAppProviders";
import { isPublicSectionVisible } from "@/lib/cms-page-defaults";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

export async function PublicShell({
  children,
  showFooter = true,
  showCompareLink = false,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
  showCompareLink?: boolean;
}) {
  const siteContent = await getGroupedSiteContentBySections(["faq_page", "reviews_page", "footer"]);
  const showFaqLink = isPublicSectionVisible(siteContent, "faq_page", "show_page", true);
  const showReviewsLink = isPublicSectionVisible(siteContent, "reviews_page", "show_page", true);

  return (
    <PublicAppProviders>
      <ConcordSiteHeader
        showFaqLink={showFaqLink}
        showReviewsLink={showReviewsLink}
        showCompareLink={showCompareLink}
      />
      {children}
      {showFooter ? <ConcordSiteFooter siteContent={siteContent} /> : null}
    </PublicAppProviders>
  );
}
