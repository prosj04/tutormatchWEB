import { redirect } from "next/navigation";

import "../../portal-design.css";

import { PortalDesignProvider } from "@/components/providers/PortalDesignProvider";
import { PortalSiteContentProvider } from "@/components/providers/PortalSiteContentProvider";
import { TeacherPortalShell } from "@/components/teacher-portal/TeacherPortalShell";
import { auth } from "@/auth";
import { isPortalTeacherRole } from "@/lib/portal-roles";
import type { PortalTeacherRole } from "@/lib/portal-roles";
import { getTeacherByUserId } from "@/lib/get-teacher-cache";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

export const dynamic = "force-dynamic";

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

  const siteContent = await getGroupedSiteContentBySections(["teacher_portal"]);

  return (
    <PortalDesignProvider>
      <PortalSiteContentProvider value={siteContent}>
        <TeacherPortalShell
          teacherName={teacher.name}
          role={session.user.role as PortalTeacherRole}
        >
          {children}
        </TeacherPortalShell>
      </PortalSiteContentProvider>
    </PortalDesignProvider>
  );
}
