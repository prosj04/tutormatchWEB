import { NextResponse } from "next/server";

import { requireNotificationUser } from "@/lib/notification-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  const authResult = await requireNotificationUser();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const { id } = await context.params;

  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json({ notification: updated });
}
