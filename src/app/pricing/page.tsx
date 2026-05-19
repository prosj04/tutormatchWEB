import { PricingContent } from "@/components/pricing/PricingContent";
import { getGroupedSiteContent } from "@/lib/site-content";

export const revalidate = 60;

export const metadata = {
  title: "요금제",
};

export default async function PricingPage() {
  const siteContent = await getGroupedSiteContent();
  return <PricingContent siteContent={siteContent} />;
}
