import { NextResponse } from "next/server";

import {
  formatRelativeTime,
  getNotificationIcon,
  resolveNotificationHref,
} from "@/lib/notifications";
import { requireNotificationUser } from "@/lib/notification-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireNotificationUser();
  if ("error" in authResult) return authResult.error;
  const { userId, role } = authResult;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
