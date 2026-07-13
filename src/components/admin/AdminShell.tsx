"use client";

import { isPortalConcordDesign } from "@/lib/portal-design";

import { AdminShellConcord } from "./AdminShellConcord";
import { AdminShellLegacy } from "./AdminShellLegacy";

type AdminShellProps = {
  email: string;
  children: React.ReactNode;
};

export function AdminShell(props: AdminShellProps) {
  if (isPortalConcordDesign()) {
    return <AdminShellConcord {...props} />;
  }
  return <AdminShellLegacy {...props} />;
}
