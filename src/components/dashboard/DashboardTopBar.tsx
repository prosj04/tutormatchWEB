"use client";

import { isPortalConcordDesign } from "@/lib/portal-design";

import { DashboardTopBarConcord } from "./DashboardTopBarConcord";
import { DashboardTopBarLegacy } from "./DashboardTopBarLegacy";

type DashboardTopBarProps = {
  studentName: string;
  isEditMode?: boolean;
};

export function DashboardTopBar(props: DashboardTopBarProps) {
  if (isPortalConcordDesign()) {
    return <DashboardTopBarConcord {...props} />;
  }
  return <DashboardTopBarLegacy {...props} />;
}
