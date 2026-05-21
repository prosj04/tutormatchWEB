import { PricingContent } from "@/components/pricing/PricingContent";
import { getGroupedSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "요금제",
};

export default async function PricingPage() {
  const siteContent = await getGroupedSiteContent();
  return <PricingContent siteContent={siteContent} />;
}
