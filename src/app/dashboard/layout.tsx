import { PortalSiteContentProvider } from "@/components/providers/PortalSiteContentProvider";
import { getGroupedSiteContent } from "@/lib/site-content";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const siteContent = await getGroupedSiteContent();
  return <PortalSiteContentProvider value={siteContent}>{children}</PortalSiteContentProvider>;
}
