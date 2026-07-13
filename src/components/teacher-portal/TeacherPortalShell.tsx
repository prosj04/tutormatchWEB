"use client";

import { isPortalConcordDesign } from "@/lib/portal-design";
import type { PortalTeacherRole } from "@/lib/portal-roles";

import { TeacherPortalShellConcord } from "./TeacherPortalShellConcord";
import { TeacherPortalShellLegacy } from "./TeacherPortalShellLegacy";

type TeacherPortalShellProps = {
  teacherName: string;
  role: PortalTeacherRole;
  children: React.ReactNode;
};

export function TeacherPortalShell(props: TeacherPortalShellProps) {
  if (isPortalConcordDesign()) {
    return <TeacherPortalShellConcord {...props} />;
  }
  return <TeacherPortalShellLegacy {...props} />;
}
