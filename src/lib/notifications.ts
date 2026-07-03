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
  | "STALE_MATCH_ACCEPTANCE";

/** 외부 SMS를 보낼 알림 타입 */
const SMS_NOTIFICATION_TYPES = new Set<string>([
  "TEACHER_ASSIGNED",
  "BOOKING_CONFIRMED",
  "QUESTION_UNANSWERED",
  "NEW_STUDENT_ASSIGNED",
]);

/** Expo 푸시를 보낼 알림 타입 (앱 등록 디바이스) */
const PUSH_NOTIFICATION_TYPES = new Set<string>([
  "TEACHER_ASSIGNED",
  "BOOKING_CONFIRMED",
  "TEACHER_ANSWERED",
  "NEW_STUDENT_ASSIGNED",
  "NEW_QUESTION",
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

  return notification;
}

/** userId → Student 또는 Teacher phone 조회 후 SMS 발송 (fire-and-forget) */
async function dispatchSms(userId: string, body: string): Promise<void> {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { phone: true },
    });
    const phone = student?.phone ?? (
      await prisma.teacher.findUnique({ where: { userId }, select: { phone: true } })
    )?.phone;

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
    case "SUBSCRIPTION_EXPIRY_REMINDER":
    case "LESSON_REMINDER":
      return "👤";
    case "NEW_QUESTION":
      return "✉️";
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
      return "/teacher-portal/dashboard/students";
    case "PROGRESS_WARNING":
    case "PROGRESS_DANGER":
      return "/teacher-portal/dashboard/monitoring";
    default:
      return null;
  }
}
