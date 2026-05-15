import { NextResponse } from "next/server";

import { auth } from "@/auth";

export async function requireNotificationUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  return {
    userId: session.user.id,
    role: session.user.role ?? "STUDENT",
  } as const;
}
