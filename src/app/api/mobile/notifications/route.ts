import { NextResponse } from "next/server";

import { getNotificationCategory } from "@/lib/notification-category";
import {
  formatRelativeTime,
  getNotificationIcon,
} from "@/lib/notifications";
import { requireMobileStudent } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

/** GET /api/mobile/notifications — 알림 목록 */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
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
      createdAt: n.createdAt.toISOString(),
      timeAgo: formatRelativeTime(n.createdAt.toISOString()),
      icon: getNotificationIcon(n.type),
      accent: !n.isRead,
    })),
  });
}

/** PATCH /api/mobile/notifications — 모두 읽음 */
export async function PATCH(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ updated: result.count });
}
