import { PortalSiteContentProvider } from "@/components/providers/PortalSiteContentProvider";
import { getGroupedSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const siteContent = await getGroupedSiteContent();
  return <PortalSiteContentProvider value={siteContent}>{children}</PortalSiteContentProvider>;
}
