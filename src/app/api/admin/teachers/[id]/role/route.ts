import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireAdmin } from "@/lib/admin-auth";
import { PUBLIC_TEACHERS_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit-log";

const ALLOWED_ROLES = [UserRole.TEACHER, UserRole.MANAGER] as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

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

  const rawRole = typeof body.role === "string" ? body.role : "";
  const role = ALLOWED_ROLES.find((r) => r === rawRole);
  if (!role) {
    return NextResponse.json(
      { error: "role must be TEACHER or MANAGER" },
      { status: 400 },
    );
  }

  if (
    teacher.user.role !== UserRole.TEACHER &&
    teacher.user.role !== UserRole.MANAGER
  ) {
    return NextResponse.json(
      { error: "Cannot change role for this account" },
      { status: 400 },
    );
  }

  const oldRole = teacher.user.role;
  const user = await prisma.user.update({
    where: { id: teacher.userId },
    data: { role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  recordAudit({
    actorUserId: session.user.id,
    actorRole: session.user.role ?? "ADMIN",
    action: "ROLE_CHANGE",
    targetType: "Teacher",
    targetId: id,
    detail: JSON.stringify({ from: oldRole, to: role }),
  });

  revalidatePublicCms(PUBLIC_TEACHERS_CACHE_TAG);
  return NextResponse.json({ user });
}
