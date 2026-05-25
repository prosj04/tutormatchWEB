import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { PUBLIC_TEACHERS_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";
import { prisma } from "@/lib/prisma";
import {
  createSupabaseBrowserClient,
  TEACHER_PHOTO_BUCKET,
} from "@/lib/supabase-client";
import { startPerfTimer, timeAsync, timeSync } from "@/lib/perf-timer";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  const teacher = await timeAsync(
    "prisma.adminTeacher.findUnique.photo",
    () =>
      prisma.teacher.findUnique({
        where: { id },
        select: { id: true },
      }),
    { teacherId: id },
  );

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  const supabase = createSupabaseBrowserClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${id}/profile-${Date.now()}.${ext}`;

  const uploadTimer = startPerfTimer("supabase.adminTeacherPhoto.upload", {
    teacherId: id,
    path,
    fileName: file.name,
  });
  const { data, error } = await supabase.storage
    .from(TEACHER_PHOTO_BUCKET)
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  uploadTimer.end();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicData = timeSync(
    "supabase.adminTeacherPhoto.getPublicUrl",
    () =>
      supabase.storage
        .from(TEACHER_PHOTO_BUCKET)
        .getPublicUrl(data.path).data,
    { path: data.path },
  );

  const photoUrl = publicData.publicUrl;

  await timeAsync(
    "prisma.teacherProfile.upsert.photo",
    () =>
      prisma.teacherProfile.upsert({
        where: { teacherId: id },
        create: {
          teacherId: id,
          photoUrl,
        },
        update: {
          photoUrl,
        },
      }),
    { teacherId: id },
  );

  revalidatePublicCms(PUBLIC_TEACHERS_CACHE_TAG);
  return NextResponse.json({ photoUrl });
}
