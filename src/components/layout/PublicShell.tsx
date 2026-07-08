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
  hideStickyCta = false,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
  showCompareLink?: boolean;
  /**
   * true면 하단 고정 CTA 바(StickyConsultCta)를 렌더하지 않는다(예: /consult).
   * 상단 안내 배너(TopUrgencyBanner)는 현재 shell에서 렌더하지 않으므로 자동으로 함께 숨겨진다.
   */
  hideStickyCta?: boolean;
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
      {hideStickyCta ? null : (
        <StickyConsultCta
          copy={siteContent["sticky_cta"] ?? {}}
          enabled={isPublicSectionVisible(siteContent, "sticky_cta", "bar_visible", true)}
        />
      )}
    </PublicAppProviders>
  );
}
