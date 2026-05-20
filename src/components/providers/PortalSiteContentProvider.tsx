"use client";

import { createContext, useContext } from "react";

import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import type { GroupedSiteContent } from "@/lib/site-content";

const PortalSiteContentContext = createContext<GroupedSiteContent | null>(null);

export function PortalSiteContentProvider({
  value,
  children,
}: {
  value: GroupedSiteContent;
  children: React.ReactNode;
}) {
  return <PortalSiteContentContext.Provider value={value}>{children}</PortalSiteContentContext.Provider>;
}

export function usePortalSiteContent(): GroupedSiteContent | null {
  return useContext(PortalSiteContentContext);
}

/** 로그인 후 포털 UI — Provider 밖이면 fallback */
export function usePortalCopy(section: string, key: string, fallback: string): string {
  const ctx = usePortalSiteContent();
  return getCmsSectionValue(ctx ?? undefined, section, key, fallback);
}
