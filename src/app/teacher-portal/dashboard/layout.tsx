import { redirect } from "next/navigation";

import { PortalSiteContentProvider } from "@/components/providers/PortalSiteContentProvider";
import { TeacherPortalShell } from "@/components/teacher-portal/TeacherPortalShell";
import { auth } from "@/auth";
import { isPortalTeacherRole } from "@/lib/portal-roles";
import type { PortalTeacherRole } from "@/lib/portal-roles";
import { getTeacherByUserId } from "@/lib/get-teacher-cache";
import { getGroupedSiteContent } from "@/lib/site-content";

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || !isPortalTeacherRole(session.user.role)) {
    redirect("/teacher-portal");
  }

  const teacher = await getTeacherByUserId(session.user.id);

  if (!teacher) {
    redirect("/teacher-portal");
  }

  const siteContent = await getGroupedSiteContent();

  return (
    <PortalSiteContentProvider value={siteContent}>
      <TeacherPortalShell
        teacherName={teacher.name}
        role={session.user.role as PortalTeacherRole}
      >
        {children}
      </TeacherPortalShell>
    </PortalSiteContentProvider>
  );
}
