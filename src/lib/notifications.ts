import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "QUESTION_UNANSWERED"
  | "PROGRESS_WARNING"
  | "PROGRESS_DANGER"
  | "NEW_BOOKING"
  | "BOOKING_CONFIRMED"
  | "TEACHER_ANSWERED"
  | "TEACHER_COMMENT"
  | "NEW_STUDENT_ASSIGNED"
  | "TEACHER_ASSIGNED"
  | "NEW_QUESTION";

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
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      relatedId: relatedId ?? null,
    },
  });
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
    case "BOOKING_CONFIRMED":
      return "📅";
    case "TEACHER_ANSWERED":
      return "💬";
    case "TEACHER_COMMENT":
      return "📝";
    case "NEW_STUDENT_ASSIGNED":
    case "TEACHER_ASSIGNED":
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
      return "/dashboard";
    case "BOOKING_CONFIRMED":
      return "/dashboard/consultation";
    case "NEW_BOOKING":
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
