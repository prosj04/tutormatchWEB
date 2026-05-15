export const PORTAL_TEACHER_ROLES = ["TEACHER", "MANAGER"] as const;

export type PortalTeacherRole = (typeof PORTAL_TEACHER_ROLES)[number];

export function isPortalTeacherRole(role: string | undefined): role is PortalTeacherRole {
  return PORTAL_TEACHER_ROLES.includes(role as PortalTeacherRole);
}
