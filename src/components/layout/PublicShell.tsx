import { ConcordSiteFooter } from "@/components/concord/ConcordSiteFooter";
import { ConcordSiteHeader } from "@/components/concord/ConcordSiteHeader";
import { StickyConsultCta } from "@/components/layout/StickyConsultCta";
import { TopUrgencyBanner } from "@/components/layout/TopUrgencyBanner";
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
  const siteContent = await getGroupedSiteContentBySections([
    "faq_page",
    "reviews_page",
    "footer",
    "site_banner",
    "signup_modal",
  ]);
  const showFaqLink = isPublicSectionVisible(siteContent, "faq_page", "show_page", true);
  const showReviewsLink = isPublicSectionVisible(siteContent, "reviews_page", "show_page", true);

  return (
    <PublicAppProviders signupCopy={siteContent["signup_modal"] ?? {}}>
      <TopUrgencyBanner siteContent={siteContent} />
      <ConcordSiteHeader
        showFaqLink={showFaqLink}
        showReviewsLink={showReviewsLink}
        showCompareLink={showCompareLink}
      />
      {children}
      {showFooter ? <ConcordSiteFooter siteContent={siteContent} /> : null}
      <StickyConsultCta />
    </PublicAppProviders>
  );
}
