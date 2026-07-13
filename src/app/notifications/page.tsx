import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime, getNotificationIcon, resolveNotificationHref } from "@/lib/notifications";
import { NotificationsPageClient } from "@/components/notifications/NotificationsPageClient";

export const metadata = { title: "알림" };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/teacher-portal/dashboard");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });
  if (!student) redirect("/?signup=1");

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  const items = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    relatedId: n.relatedId,
    createdAt: n.createdAt.toISOString(),
    timeAgo: formatRelativeTime(n.createdAt.toISOString()),
    icon: getNotificationIcon(n.type),
    href: resolveNotificationHref(n.type, session.user.role, n.relatedId),
  }));

  return (
    <NotificationsPageClient
      initialItems={items}
      initialUnreadCount={unreadCount}
    />
  );
}
