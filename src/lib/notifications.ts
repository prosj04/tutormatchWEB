import { prisma } from "@/lib/prisma";
import { sendExpoPushToUser } from "@/lib/expo-push";
import { sendSms } from "@/lib/sms";

export type NotificationType =
  | "QUESTION_UNANSWERED"
  | "PROGRESS_WARNING"
  | "PROGRESS_DANGER"
  | "NEW_BOOKING"
  | "NEW_STUDENT_WAITING"
  | "BOOKING_CONFIRMED"
  | "TEACHER_ANSWERED"
  | "TEACHER_COMMENT"
  | "NEW_STUDENT_ASSIGNED"
  | "TEACHER_ASSIGNED"
  | "MATCH_ACCEPTANCE_REMINDER"
  | "FIRST_LESSON_REMINDER"
  | "SUBSCRIPTION_EXPIRY_REMINDER"
  | "LESSON_REMINDER"
  | "NEW_QUESTION"
  | "VISIT_TIMES_UPDATED"
  | "STALE_MATCH_ACCEPTANCE"
  | "FIRST_LESSON_SLA_BREACH"
  | "POST_CONSULTATION_FOLLOWUP"
  | "LESSON_CANCELLED_BY_TEACHER"
  | "FIRST_LESSON_SET"
  // 수업 확인 제도
  | "LESSON_CONFIRM_REQUEST"
  | "LESSON_COMPLETED_CONFIRMED"
  | "LESSON_NOT_HELD"
  // Phase 3 additions
  | "CONSULTATION_REMINDER"
  | "SUBSCRIPTION_EXPIRY_SOON"
  | "SUBSCRIPTION_EXPIRED_SOON"
  | "SUBSCRIPTION_EXPIRED"
  | "SATISFACTION_CHECKIN_REQUEST"
  | "SATISFACTION_CHECKIN_REMINDER"
  | "SATISFACTION_LOW_SCORE"
  // Billing / auto-renewal
  | "SUBSCRIPTION_RENEWED"
  | "SUBSCRIPTION_RENEWAL_FAILED"
  | "SUBSCRIPTION_AUTO_CANCELLED";

/** 외부 SMS를 보낼 알림 타입 */
const SMS_NOTIFICATION_TYPES = new Set<string>([
  "TEACHER_ASSIGNED",
  "BOOKING_CONFIRMED",
  "QUESTION_UNANSWERED",
  "NEW_STUDENT_ASSIGNED",
  "LESSON_CANCELLED_BY_TEACHER",
  // Phase 3 additions
  "CONSULTATION_REMINDER",
  "SUBSCRIPTION_EXPIRY_SOON",
  "SUBSCRIPTION_EXPIRED_SOON",
  "SUBSCRIPTION_EXPIRED",
  "SATISFACTION_CHECKIN_REQUEST",
  "SATISFACTION_CHECKIN_REMINDER",
  "SUBSCRIPTION_RENEWED",
  "SUBSCRIPTION_RENEWAL_FAILED",
  "SUBSCRIPTION_AUTO_CANCELLED",
]);

/** Expo 푸시를 보낼 알림 타입 (앱 등록 디바이스) */
const PUSH_NOTIFICATION_TYPES = new Set<string>([
  "TEACHER_ASSIGNED",
  "BOOKING_CONFIRMED",
  "TEACHER_ANSWERED",
  "NEW_STUDENT_ASSIGNED",
  "NEW_QUESTION",
]);

/**
 * 학부모 팬아웃 화이트리스트 — 오너 확정 정책 "결제 + 핵심만".
 * 학생 userId로 이 타입 알림이 생성되면 연결된 학부모(ParentStudent)에게도 복제한다.
 * 그 외 타입은 절대 복제 금지(학부모 피로도 방지).
 */
const PARENT_FANOUT_TYPES = new Set<string>([
  "SUBSCRIPTION_RENEWAL_FAILED",
  "SUBSCRIPTION_AUTO_CANCELLED",
  "SUBSCRIPTION_EXPIRED",
  "SUBSCRIPTION_EXPIRY_SOON",
  "SUBSCRIPTION_EXPIRED_SOON",
  "LESSON_CANCELLED_BY_TEACHER",
  // 수업 확인 결과 3자 공지(정상 완료 / 미완료+사유) — 인앱만.
  "LESSON_COMPLETED_CONFIRMED",
  "LESSON_NOT_HELD",
  // 월간 리포트 생성(인앱만) — 매월 cron(generate-monthly-report)이 최초 생성 시 발화.
  "MONTHLY_REPORT_READY",
]);

/**
 * 학부모에게도 SMS까지 보낼 팬아웃 타입(결제 계열). 나머지 팬아웃 타입은 인앱만.
 */
const PARENT_FANOUT_SMS_TYPES = new Set<string>([
  "SUBSCRIPTION_RENEWAL_FAILED",
  "SUBSCRIPTION_AUTO_CANCELLED",
  "SUBSCRIPTION_EXPIRED",
  "SUBSCRIPTION_EXPIRY_SOON",
  "SUBSCRIPTION_EXPIRED_SOON",
]);

export async function createNotification({
  userId,
  type,
  title,
  body,
  relatedId,
}: {
  userId: string;
  type: string;
  title: string;
  body: string;
  relatedId?: string | null;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      relatedId: relatedId ?? null,
    },
  });

  if (SMS_NOTIFICATION_TYPES.has(type)) {
    void dispatchSms(userId, body);
  }

  if (PUSH_NOTIFICATION_TYPES.has(type)) {
    void sendExpoPushToUser(userId, {
      title,
      body,
      data: {
        type,
        relatedId: relatedId ?? "",
      },
    });
  }

  // 학부모 팬아웃 — 화이트리스트 타입만, 단일 지점에서 분기(생성부는 손대지 않음).
  if (PARENT_FANOUT_TYPES.has(type)) {
    void fanoutToParents({ studentUserId: userId, type, title, body, relatedId });
  }

  return notification;
}

/**
 * 학생 userId에 연결된 학부모들에게 알림을 복제 발송한다.
 * 화이트리스트 타입만 도달(호출부에서 필터됨). 결제 계열은 SMS까지, 그 외는 인앱만.
 * fire-and-forget — 원 알림 생성 흐름을 막지 않는다.
 */
async function fanoutToParents({
  studentUserId,
  type,
  title,
  body,
  relatedId,
}: {
  studentUserId: string;
  type: string;
  title: string;
  body: string;
  relatedId?: string | null;
}): Promise<void> {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      select: {
        parentLinks: {
          select: {
            parent: {
              select: { userId: true, phone: true, deletedAt: true },
            },
          },
        },
      },
    });
    if (!student) return;

    const wantsSms = PARENT_FANOUT_SMS_TYPES.has(type);

    await Promise.all(
      student.parentLinks
        .map((ps) => ps.parent)
        .filter((p) => p && p.deletedAt === null)
        .map(async (parent) => {
          await prisma.notification.create({
            data: {
              userId: parent.userId,
              type,
              title,
              body,
              relatedId: relatedId ?? null,
            },
          });
          if (wantsSms && parent.phone) {
            await sendSms(parent.phone, `[Concord] ${body}`);
          }
        }),
    );
  } catch (e) {
    console.error("[notifications] fanoutToParents error:", e);
  }
}

/** userId → Student 또는 Teacher phone 조회 후 SMS 발송 (fire-and-forget) */
async function dispatchSms(userId: string, body: string): Promise<void> {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { phone: true },
    });
    const phone =
      student?.phone ??
      (await prisma.teacher.findUnique({ where: { userId }, select: { phone: true } }))?.phone ??
      (await prisma.parent.findUnique({ where: { userId }, select: { phone: true } }))?.phone;

    if (phone) {
      await sendSms(phone, `[Concord] ${body}`);
    }
  } catch (e) {
    console.error("[SMS] dispatchSms error:", e);
  }
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(months / 12)}년 전`;
}

export function getNotificationIcon(type: string): string {
  switch (type) {
    case "QUESTION_UNANSWERED":
      return "❓";
    case "PROGRESS_WARNING":
      return "⚠️";
    case "PROGRESS_DANGER":
      return "🔴";
    case "NEW_BOOKING":
    case "NEW_STUDENT_WAITING":
    case "BOOKING_CONFIRMED":
      return "📅";
    case "TEACHER_ANSWERED":
      return "💬";
    case "TEACHER_COMMENT":
      return "📝";
    case "NEW_STUDENT_ASSIGNED":
    case "TEACHER_ASSIGNED":
    case "MATCH_ACCEPTANCE_REMINDER":
    case "STALE_MATCH_ACCEPTANCE":
    case "FIRST_LESSON_REMINDER":
    case "FIRST_LESSON_SLA_BREACH":
    case "SUBSCRIPTION_EXPIRY_REMINDER":
    case "LESSON_REMINDER":
      return "👤";
    case "POST_CONSULTATION_FOLLOWUP":
      return "💬";
    case "LESSON_CANCELLED_BY_TEACHER":
    case "FIRST_LESSON_SET":
      return "📅";
    case "LESSON_CONFIRM_REQUEST":
      return "✅";
    case "LESSON_COMPLETED_CONFIRMED":
      return "✅";
    case "LESSON_NOT_HELD":
      return "📅";
    case "NEW_QUESTION":
      return "✉️";
    case "CONSULTATION_REMINDER":
      return "📅";
    case "SUBSCRIPTION_EXPIRY_SOON":
    case "SUBSCRIPTION_EXPIRED_SOON":
    case "SUBSCRIPTION_EXPIRED":
    case "SUBSCRIPTION_RENEWED":
    case "SUBSCRIPTION_RENEWAL_FAILED":
    case "SUBSCRIPTION_AUTO_CANCELLED":
      return "💳";
    case "SATISFACTION_CHECKIN_REQUEST":
      return "😊";
    case "SATISFACTION_LOW_SCORE":
      return "⚠️";
    default:
      return "🔔";
  }
}

export function resolveNotificationHref(
  type: string,
  role: string,
  relatedId: string | null,
): string | null {
  if (!relatedId && type !== "NEW_BOOKING") return null;

  switch (type) {
    case "QUESTION_UNANSWERED":
    case "NEW_QUESTION":
      return role === "STUDENT"
        ? "/dashboard"
        : "/teacher-portal/dashboard/students";
    case "TEACHER_ANSWERED":
    case "TEACHER_COMMENT":
    case "TEACHER_ASSIGNED":
    case "MATCH_ACCEPTANCE_REMINDER":
    case "STALE_MATCH_ACCEPTANCE":
      return "/dashboard";
    case "FIRST_LESSON_REMINDER":
    case "FIRST_LESSON_SLA_BREACH":
      return "/teacher-portal/dashboard/students";
    case "SUBSCRIPTION_EXPIRY_REMINDER":
      return "/pricing";
    case "BOOKING_CONFIRMED":
    case "LESSON_REMINDER":
      return "/dashboard/consultation";
    case "NEW_BOOKING":
    case "NEW_STUDENT_WAITING":
      return "/teacher-portal/dashboard/consultations";
    case "NEW_STUDENT_ASSIGNED":
    case "POST_CONSULTATION_FOLLOWUP":
      return "/teacher-portal/dashboard/students";
    case "LESSON_CANCELLED_BY_TEACHER":
      return role === "STUDENT"
        ? "/dashboard"
        : "/teacher-portal/dashboard/students";
    case "FIRST_LESSON_SET":
      return role === "STUDENT"
        ? "/dashboard"
        : "/dashboard/consultation";
    case "LESSON_CONFIRM_REQUEST":
      return "/teacher-portal/dashboard";
    case "LESSON_COMPLETED_CONFIRMED":
    case "LESSON_NOT_HELD":
      return role === "STUDENT"
        ? "/dashboard"
        : "/teacher-portal/dashboard/students";
    case "MONTHLY_REPORT_READY":
      return role === "PARENT" ? "/parent/reports" : "/dashboard/reports";
    case "PROGRESS_WARNING":
    case "PROGRESS_DANGER":
      return "/teacher-portal/dashboard/monitoring";
    case "CONSULTATION_REMINDER":
      return role === "STUDENT"
        ? "/dashboard/consultation"
        : "/teacher-portal/dashboard/consultations";
    case "SUBSCRIPTION_EXPIRY_SOON":
    case "SUBSCRIPTION_EXPIRED_SOON":
    case "SUBSCRIPTION_EXPIRED":
      return "/pricing";
    case "SUBSCRIPTION_RENEWED":
    case "SUBSCRIPTION_RENEWAL_FAILED":
    case "SUBSCRIPTION_AUTO_CANCELLED":
      return "/payments";
    case "SATISFACTION_CHECKIN_REQUEST":
      return "/dashboard";
    case "SATISFACTION_LOW_SCORE":
      return "/teacher-portal/dashboard/monitoring";
    default:
      return null;
  }
}
