import { ConcordSiteFooter } from "@/components/concord/ConcordSiteFooter";
import { ConcordSiteHeader } from "@/components/concord/ConcordSiteHeader";
import { StickyConsultCta } from "@/components/layout/StickyConsultCta";
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
    "site_header",
    "sticky_cta",
  ]);
  const showFaqLink = isPublicSectionVisible(siteContent, "faq_page", "show_page", true);
  const showReviewsLink = isPublicSectionVisible(siteContent, "reviews_page", "show_page", true);

  return (
    <PublicAppProviders signupCopy={siteContent["signup_modal"] ?? {}}>
      <ConcordSiteHeader
        showFaqLink={showFaqLink}
        showReviewsLink={showReviewsLink}
        showCompareLink={showCompareLink}
        navCopy={siteContent["site_header"] ?? {}}
      />
      {children}
      {showFooter ? <ConcordSiteFooter siteContent={siteContent} /> : null}
      <StickyConsultCta
        copy={siteContent["sticky_cta"] ?? {}}
        enabled={isPublicSectionVisible(siteContent, "sticky_cta", "bar_visible", true)}
      />
    </PublicAppProviders>
  );
}
