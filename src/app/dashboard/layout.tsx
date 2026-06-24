import "../portal-design.css";

import { PortalDesignProvider } from "@/components/providers/PortalDesignProvider";
import { PortalSiteContentProvider } from "@/components/providers/PortalSiteContentProvider";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const siteContent = await getGroupedSiteContentBySections([
    "student_dashboard",
    "student_task_list",
    "student_questions",
    "student_question_modal",
    "student_copy_plan",
    "student_consultation",
    "visit_picker",
  ]);
  return (
    <PortalDesignProvider>
      <PortalSiteContentProvider value={siteContent}>{children}</PortalSiteContentProvider>
    </PortalDesignProvider>
  );
}
