import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  const match = await prisma.teacherStudent.findUnique({ where: { id } });
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { isActive?: unknown; subjects?: unknown; startDate?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: { isActive?: boolean; subjects?: string; startDate?: string } = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.subjects === "string") data.subjects = body.subjects.trim();
  if (typeof body.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) {
    data.startDate = body.startDate;
  }

  const updated = await prisma.teacherStudent.update({
    where: { id },
    data,
    include: {
      teacher: { select: { id: true, name: true } },
      student: { select: { id: true, name: true, grade: true } },
    },
  });

  return NextResponse.json({ match: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  const match = await prisma.teacherStudent.findUnique({ where: { id } });
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.teacherStudent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
