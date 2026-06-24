import { PricingContent } from "@/components/pricing/PricingContent";
import { startPerfTimer } from "@/lib/perf-timer";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

export const revalidate = 300;

export const metadata = {
  title: "요금제",
};

type SearchParams = { cms_edit?: string | string[] };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const timer = startPerfTimer("page.pricing.total");
  const isEditMode = first(searchParams?.cms_edit) === "1";
  const siteContent = await getGroupedSiteContentBySections(["pricing_page", "spacing"]);
  const page = <PricingContent siteContent={siteContent} isEditMode={isEditMode} />;
  timer.end();
  return page;
}
