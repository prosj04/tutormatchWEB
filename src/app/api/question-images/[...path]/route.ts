import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { QUESTION_IMAGE_BUCKET } from "@/lib/supabase-client";

type RouteContext = {
  params: {
    path?: string[];
  };
};

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
};

function contentTypeForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

function hasUnsafePathSegment(path: string[]): boolean {
  return path.some((segment) => segment === "" || segment === "." || segment === "..");
}

async function canAccessQuestionImage(userId: string, role: string, studentId: string) {
  if (role === "ADMIN" || role === "CHIEF_MANAGER" || role === "MANAGER") {
    return true;
  }

  if (role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });
    return student?.id === studentId;
  }

  if (role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!teacher) return false;

    const [teacherStudent, managerStudent] = await Promise.all([
      prisma.teacherStudent.findUnique({
        where: {
          teacherId_studentId: {
            teacherId: teacher.id,
            studentId,
          },
        },
        select: { id: true },
      }),
      prisma.managerStudent.findUnique({
        where: {
          managerId_studentId: {
            managerId: teacher.id,
            studentId,
          },
        },
        select: { id: true },
      }),
    ]);

    return Boolean(teacherStudent || managerStudent);
  }

  return false;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;

  if (!userId || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = params.path ?? [];
  if (path.length < 2 || hasUnsafePathSegment(path)) {
    return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
  }

  const studentId = path[0];
  const allowed = await canAccessQuestionImage(userId, role, studentId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const storagePath = path.join("/");
  const { data, error } = await createSupabaseAdminClient()
    .storage
    .from(QUESTION_IMAGE_BUCKET)
    .download(storagePath);

  if (error) {
    const status = error.message.toLowerCase().includes("not found") ? 404 : 500;
    return NextResponse.json(
      { error: status === 404 ? "Image not found" : "Failed to load image" },
      { status },
    );
  }

  return new Response(data, {
    headers: {
      "Content-Type": contentTypeForPath(storagePath),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
