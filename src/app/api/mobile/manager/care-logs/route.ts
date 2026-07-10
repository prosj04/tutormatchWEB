import { NextResponse } from "next/server";

import { requireMobileManager } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

/** Validates that the manager has authority over the student.
 *  Auth: booking.managerId matches OR chief role. */
async function managerOwnsStudent(
  managerId: string,
  role: string,
  studentId: string,
): Promise<boolean> {
  if (role === "CHIEF_MANAGER") return true;
  const booking = await prisma.consultationBooking.findFirst({
    where: { studentId, managerId },
    select: { id: true },
  });
  return booking !== null;
}

/** Resolve the caller's user role for authority checks (mirrors web session.user.role). */
async function callerRole(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role ?? "MANAGER";
}

/** POST /api/mobile/manager/care-logs
 *  body: { studentId, type: "CONSULT"|"INTERVENTION"|"CHECK", note, visibleToStudent? }
 */
export async function POST(request: Request) {
  const authResult = await requireMobileManager(request);
  if ("error" in authResult) return authResult.error;
  const { teacher, userId } = authResult;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const studentId = typeof body["studentId"] === "string" ? body["studentId"].trim() : "";
  if (!studentId) {
    return NextResponse.json({ error: "studentId is required" }, { status: 400 });
  }

  const VALID_TYPES = ["CONSULT", "INTERVENTION", "CHECK"] as const;
  type CareLogType = (typeof VALID_TYPES)[number];
  const type = typeof body["type"] === "string" ? body["type"] : "";
  if (!VALID_TYPES.includes(type as CareLogType)) {
    return NextResponse.json(
      { error: "type must be CONSULT, INTERVENTION, or CHECK" },
      { status: 400 },
    );
  }

  const rawNote = typeof body["note"] === "string" ? body["note"].trim() : "";
  if (!rawNote) {
    return NextResponse.json({ error: "note is required" }, { status: 400 });
  }
  const note = rawNote.substring(0, 1000);

  const visibleToStudent =
    body["visibleToStudent"] === false ? false : true;

  const owns = await managerOwnsStudent(teacher.id, await callerRole(userId), studentId);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const log = await prisma.managerCareLog.create({
    data: {
      managerId: teacher.id,
      studentId,
      type: type as CareLogType,
      note,
      visibleToStudent,
    },
  });

  return NextResponse.json({ log }, { status: 201 });
}

/** GET /api/mobile/manager/care-logs?studentId=... */
export async function GET(request: Request) {
  const authResult = await requireMobileManager(request);
  if ("error" in authResult) return authResult.error;
  const { teacher, userId } = authResult;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId")?.trim() ?? "";
  if (!studentId) {
    return NextResponse.json({ error: "studentId query param required" }, { status: 400 });
  }

  const owns = await managerOwnsStudent(teacher.id, await callerRole(userId), studentId);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.managerCareLog.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ logs });
}
