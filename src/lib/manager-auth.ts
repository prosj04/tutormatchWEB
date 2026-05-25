import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getTeacherByUserId } from "@/lib/get-teacher-cache";

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

  const teacher = await getTeacherByUserId(session.user.id);

  if (!teacher) {
    return {
      error: NextResponse.json({ error: "Manager not found" }, { status: 404 }),
    } as const;
  }

  return { session, teacher, userId: session.user.id } as const;
}
