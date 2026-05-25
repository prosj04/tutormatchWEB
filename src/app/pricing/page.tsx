import { PricingContent } from "@/components/pricing/PricingContent";
import { startPerfTimer } from "@/lib/perf-timer";
import { getGroupedSiteContent } from "@/lib/site-content";

export const revalidate = 300;

export const metadata = {
  title: "요금제",
};

export default async function PricingPage() {
  const timer = startPerfTimer("page.pricing.total");
  const siteContent = await getGroupedSiteContent();
  const page = <PricingContent siteContent={siteContent} />;
  timer.end();
  return page;
}
