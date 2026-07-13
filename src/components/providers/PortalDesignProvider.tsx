"use client";

import { useEffect } from "react";

import { getPortalDesign, type PortalDesign } from "@/lib/portal-design";

const STORAGE_KEY = "portal-design-override";

function resolveDesign(): PortalDesign {
  if (typeof window === "undefined") return getPortalDesign();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "legacy" || stored === "concord") return stored;
  } catch {
    /* ignore */
  }
  return getPortalDesign();
}

export function PortalDesignProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-portal-design", resolveDesign());
  }, []);

  return children;
}
