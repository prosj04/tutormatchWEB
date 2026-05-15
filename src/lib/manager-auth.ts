import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireManager() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (session.user.role !== "MANAGER") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
  });

  if (!teacher) {
    return {
      error: NextResponse.json({ error: "Manager not found" }, { status: 404 }),
    } as const;
  }

  return { session, teacher, userId: session.user.id } as const;
}
