import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { PUBLIC_TEACHERS_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";
import { prisma } from "@/lib/prisma";

type TeacherApprovalBody = {
  teacherId?: unknown;
  approve?: unknown;
};

async function requireChiefManagerApprovalAccess() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult;

  const role = authResult.session.user.role;
  if (role !== "CHIEF_MANAGER" && role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  return authResult;
}

export async function GET() {
  const authResult = await requireChiefManagerApprovalAccess();
  if ("error" in authResult) return authResult.error;

  const pendingTeachers = await prisma.teacher.findMany({
    where: { approved: false, name: { not: { startsWith: "[sample]" } } },
    orderBy: { user: { createdAt: "desc" } },
    select: {
      id: true,
      name: true,
      subjects: true,
      phone: true,
      user: { select: { email: true, createdAt: true } },
    },
  });

  return NextResponse.json({
    pendingTeachers: pendingTeachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.user.email,
      subjects: teacher.subjects,
      phone: teacher.phone,
      createdAt: teacher.user.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const authResult = await requireChiefManagerApprovalAccess();
  if ("error" in authResult) return authResult.error;

  let body: TeacherApprovalBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const teacherId = typeof body.teacherId === "string" ? body.teacherId : "";
  const approve = body.approve;

  if (!teacherId || typeof approve !== "boolean") {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, userId: true },
  });
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  if (approve) {
    await prisma.teacher.update({
      where: { id: teacherId },
      data: { approved: true },
    });
  } else {
    await prisma.user.delete({ where: { id: teacher.userId } });
  }

  revalidatePublicCms(PUBLIC_TEACHERS_CACHE_TAG);
  return NextResponse.json({ ok: true });
}
