import { prisma } from "@/lib/prisma";

export interface AuditParams {
  actorUserId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  detail?: string;
}

/**
 * Fire-and-forget audit log writer (BR-15).
 * Never throws — audit failures must not break the main request flow.
 */
export function recordAudit(params: AuditParams): void {
  prisma.auditLog
    .create({
      data: {
        actorUserId: params.actorUserId,
        actorRole: params.actorRole,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        detail: params.detail ?? null,
      },
    })
    .catch((err: unknown) => {
      console.error("[audit-log] Failed to write audit record:", err);
    });
}
