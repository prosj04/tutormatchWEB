import { auth } from "@/auth";
import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { CheckoutContent } from "@/components/checkout/CheckoutContent";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import {
  parseSessionsParam,
  parseSubjectsParam,
  type SessionPlan,
  type SubjectCount,
} from "@/lib/order-pricing";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

type Search = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export const metadata = {
  title: "결제",
};

type PageProps = {
  searchParams: Search;
};

export default async function CheckoutPage({ searchParams }: PageProps) {
  const session = await auth();
  const siteContent = await getGroupedSiteContentBySections(["checkout_page"]);
  const tutorId = first(searchParams.tutor) ?? "1";
  const sessionsRaw = first(searchParams.sessions);
  const sessions: SessionPlan = parseSessionsParam(sessionsRaw);
  const subjects: SubjectCount = parseSubjectsParam(first(searchParams.subjects));
  const needsSignup =
    !session?.user?.id || session.user.role !== "STUDENT";
  const isEditMode = first(searchParams.cms_edit) === "1";
  const showFailBanner = first(searchParams.error) === "1";
  const failBannerText = getCmsSectionValue(
    siteContent,
    "checkout_page",
    "fail_banner",
    "결제가 완료되지 않았습니다. 다시 시도하거나 다른 수단을 선택해 주세요.",
  );

  return (
    <>
      {showFailBanner ? (
        <CmsEdit active={isEditMode} section="checkout_page" cmsKey="fail_banner" type="text">
          <div className="border-b border-accent/20 bg-accent/5 px-4 py-3 text-center text-sm text-text-primary sm:px-6 md:px-8">
            {failBannerText}
          </div>
        </CmsEdit>
      ) : null}
      <CheckoutContent
        tutorId={tutorId}
        sessions={sessions}
        subjects={subjects}
        siteContent={siteContent}
        needsSignup={needsSignup}
        isEditMode={isEditMode}
      />
    </>
  );
}
