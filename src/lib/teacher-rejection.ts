import { recordAudit } from "@/lib/audit-log";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import { getGroupedSiteContentBySections } from "@/lib/site-content";
import { sendSms } from "@/lib/sms";

export interface TeacherRejectionParams {
  actorUserId: string;
  actorRole: string;
  teacherId: string;
  teacherName: string;
  teacherPhone: string;
  /** 반려 사유(내부 기록 전용). SMS 본문에는 포함하지 않는다. */
  reason?: string;
}

/**
 * E-REJ-1(부분): 강사 지원 반려 시 사유 감사 기록 + 강사 SMS 통지.
 *
 * - AuditLog에 반려 사유를 저장한다(스키마 변경 없이 detail 필드 사용).
 * - 반려 확정(softDelete로 phone 익명화) 직전에 강사에게 결과를 통지한다.
 *   사유 원문은 통지에 넣지 않고, 문의처(CMS 상담 전화)만 안내한다.
 * - SMS 유틸은 env 미설정 시 자동 no-op이므로 별도 분기 없이 그대로 호출한다.
 */
export async function recordTeacherRejection(
  params: TeacherRejectionParams,
): Promise<void> {
  const { actorUserId, actorRole, teacherId, reason } = params;

  recordAudit({
    actorUserId,
    actorRole,
    action: "TEACHER_APPLICATION_REJECT",
    targetType: "Teacher",
    targetId: teacherId,
    detail: reason ? JSON.stringify({ reason }) : undefined,
  });

  await notifyTeacherRejection(params.teacherPhone);
}

/** 반려 결과 안내 SMS 발송. 사유는 포함하지 않고 문의처만 안내한다. */
async function notifyTeacherRejection(teacherPhone: string): Promise<void> {
  if (!teacherPhone) return;

  const siteContent = await getGroupedSiteContentBySections(["footer"]);
  const contactPhone = getCmsSectionValue(
    siteContent,
    "footer",
    "phone_number",
    "",
  ).trim();

  const contactLine = contactPhone ? ` 문의: ${contactPhone}` : "";
  const text =
    "Concord 강사 지원 결과 안내 — 아쉽지만 이번에는 함께하지 못하게 되었어요." +
    contactLine;

  await sendSms(teacherPhone, text);
}
