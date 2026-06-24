import { PricingContent } from "@/components/pricing/PricingContent";
import { startPerfTimer } from "@/lib/perf-timer";

export const revalidate = 300;

export const metadata = {
  title: "요금제",
};

export default async function PricingPage() {
  const timer = startPerfTimer("page.pricing.total");
  const page = <PricingContent />;
  timer.end();
  return page;
}
