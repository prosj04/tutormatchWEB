import { NextResponse } from "next/server";

import { getNotificationCategory } from "@/lib/notification-category";
import {
  formatRelativeTime,
  getNotificationIcon,
} from "@/lib/notifications";
import { requireMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

/** GET /api/mobile/notifications — 알림 목록 (역할 무관, 자기 것만) */
export async function GET(request: Request) {
  const authResult = await requireMobileUser(request);
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return NextResponse.json({
    unreadCount,
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      category: getNotificationCategory(n.type),
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      relatedId: n.relatedId,
      createdAt: n.createdAt.toISOString(),
      timeAgo: formatRelativeTime(n.createdAt.toISOString()),
      icon: getNotificationIcon(n.type),
      accent: !n.isRead,
    })),
  });
}

/**
 * PATCH /api/mobile/notifications — 읽음 처리 (역할 무관, 자기 것만)
 *  body 없음 또는 {}  → 모두 읽음
 *  body { ids: string[] } → 해당 항목만 읽음 (G-4 개별 읽음)
 */
export async function PATCH(request: Request) {
  const authResult = await requireMobileUser(request);
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  let ids: string[] | null = null;
  try {
    const body = (await request.json()) as { ids?: unknown };
    if (Array.isArray(body?.ids)) {
      ids = body.ids.filter((v): v is string => typeof v === "string");
    }
  } catch {
    // 본문 없음 → 모두 읽음
  }

  const where =
    ids && ids.length > 0
      ? { userId, isRead: false, id: { in: ids } }
      : { userId, isRead: false };

  const result = await prisma.notification.updateMany({
    where,
    data: { isRead: true },
  });

  return NextResponse.json({ updated: result.count });
}
