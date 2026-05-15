import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { normalizePhoneDigits } from "@/lib/phone-login";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { name?: unknown; grade?: unknown; subjects?: unknown; phone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: { name?: string; grade?: string; subjects?: string; phone?: string } = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.grade === "string" && body.grade.trim()) data.grade = body.grade.trim();
  if (typeof body.subjects === "string") data.subjects = body.subjects.trim();
  if (typeof body.phone === "string") {
    const digits = normalizePhoneDigits(body.phone);
    if (digits.length >= 10) data.phone = digits;
  }

  const updated = await prisma.student.update({ where: { id }, data });
  return NextResponse.json({ student: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: student.userId } });
  return NextResponse.json({ ok: true });
}
