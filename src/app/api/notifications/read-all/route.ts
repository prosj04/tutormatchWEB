import { NextResponse } from "next/server";

import { requireNotificationUser } from "@/lib/notification-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  const authResult = await requireNotificationUser();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ updated: result.count });
}
