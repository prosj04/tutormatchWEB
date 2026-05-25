import { NextResponse } from "next/server";

import {
  formatRelativeTime,
  getNotificationIcon,
  resolveNotificationHref,
} from "@/lib/notifications";
import { requireNotificationUser } from "@/lib/notification-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requireNotificationUser();
  if ("error" in authResult) return authResult.error;
  const { userId, role } = authResult;
  const summaryOnly = new URL(request.url).searchParams.get("summary") === "1";

  if (summaryOnly) {
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({ unreadCount });
  }

  // Run both queries in parallel. count() uses the (userId, isRead) index and
  // gives an accurate total across all notifications, not just the top-50 page.
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
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      relatedId: n.relatedId,
      createdAt: n.createdAt.toISOString(),
      timeAgo: formatRelativeTime(n.createdAt.toISOString()),
      icon: getNotificationIcon(n.type),
      href: resolveNotificationHref(n.type, role, n.relatedId),
    })),
  });
}
