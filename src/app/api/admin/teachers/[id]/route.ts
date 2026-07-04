import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { softDeleteUser } from "@/lib/account-deletion";
import { PUBLIC_TEACHERS_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: {
    approved?: unknown;
    name?: unknown;
    subjects?: unknown;
    education?: unknown;
    experience?: unknown;
    bio?: unknown;
    gender?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: {
    approved?: boolean;
    name?: string;
    subjects?: string;
    education?: string;
    experience?: string;
    bio?: string;
    gender?: string | null;
  } = {};

  if (typeof body.approved === "boolean") data.approved = body.approved;
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.subjects === "string") data.subjects = body.subjects.trim();
  if (typeof body.education === "string") data.education = body.education.trim();
  if (typeof body.experience === "string") data.experience = body.experience.trim();
  if (typeof body.bio === "string") data.bio = body.bio.trim();
  if ("gender" in body) {
    if (body.gender === "FEMALE") data.gender = "FEMALE";
    else if (body.gender === "MALE") data.gender = "MALE";
    else data.gender = null;
  }

  const updated = await prisma.teacher.update({ where: { id }, data });
  revalidatePublicCms(PUBLIC_TEACHERS_CACHE_TAG);
  return NextResponse.json({ teacher: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 하드 delete는 연관 데이터를 함께 삭제하고 복구가 불가능하므로 소프트 삭제로 통일.
  await softDeleteUser(teacher.userId);
  revalidatePublicCms(PUBLIC_TEACHERS_CACHE_TAG);
  return NextResponse.json({ ok: true });
}
