import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { PUBLIC_TEACHERS_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["TEACHER", "MANAGER"] as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: { user: { select: { id: true, role: true } } },
  });

  if (!teacher) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { role?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const role = typeof body.role === "string" ? body.role : "";
  if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return NextResponse.json(
      { error: "role must be TEACHER or MANAGER" },
      { status: 400 },
    );
  }

  if (
    teacher.user.role !== "TEACHER" &&
    teacher.user.role !== "MANAGER"
  ) {
    return NextResponse.json(
      { error: "Cannot change role for this account" },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: teacher.userId },
    data: { role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  revalidatePublicCms(PUBLIC_TEACHERS_CACHE_TAG);
  return NextResponse.json({ user });
}
