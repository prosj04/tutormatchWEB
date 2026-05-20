export const PORTAL_TEACHER_ROLES = ["TEACHER", "MANAGER"] as const;

export type PortalTeacherRole = (typeof PORTAL_TEACHER_ROLES)[number];

export function isPortalTeacherRole(role: string | undefined): role is PortalTeacherRole {
  return PORTAL_TEACHER_ROLES.includes(role as PortalTeacherRole);
}

/** 로그인 후 로고·홈 링크 — 공개 마케팅 홈(/)이 아닌 역할별 포털 대시보드 */
export function portalHomeHref(role: string | undefined | null): string {
  if (role === "ADMIN") return "/admin";
  if (isPortalTeacherRole(role ?? undefined)) return "/teacher-portal/dashboard";
  if (role === "STUDENT") return "/dashboard";
  return "/";
}
