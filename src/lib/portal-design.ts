export type PortalDesign = "concord" | "legacy";

/** 빌드 타임 기본값. `legacy`로 되돌리려면 NEXT_PUBLIC_PORTAL_DESIGN=legacy */
export function getPortalDesign(): PortalDesign {
  return process.env.NEXT_PUBLIC_PORTAL_DESIGN === "legacy" ? "legacy" : "concord";
}

export function isPortalConcordDesign(): boolean {
  return getPortalDesign() === "concord";
}
