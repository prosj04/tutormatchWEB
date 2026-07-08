import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { softDeleteUser } from "@/lib/account-deletion";
import { prisma } from "@/lib/prisma";
import { normalizePhoneDigits } from "@/lib/phone-login";
import { recordAudit } from "@/lib/audit-log";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireChiefManagerOrAdmin();
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
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const { id } = await context.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await softDeleteUser(student.userId);
    recordAudit({
      actorUserId: session.user.id,
      actorRole: session.user.role ?? "ADMIN",
      action: "STUDENT_DELETE",
      targetType: "Student",
      targetId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/students/delete] error:", error);
    return NextResponse.json(
      { error: "Failed to delete student account" },
      { status: 500 },
    );
  }
}
