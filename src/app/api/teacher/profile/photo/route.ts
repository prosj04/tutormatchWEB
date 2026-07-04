import { NextResponse } from "next/server";

import { requireTeacherAllowPending } from "@/lib/teacher-auth";
import { PUBLIC_TEACHERS_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { TEACHER_PHOTO_BUCKET } from "@/lib/supabase-client";
import { startPerfTimer, timeAsync, timeSync } from "@/lib/perf-timer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** POST /api/teacher/profile/photo
 *  Authenticated teacher uploads their own profile photo.
 *  Uses the service-role admin client; the anon key is never involved.
 */
export async function POST(request: Request) {
  const authResult = await requireTeacherAllowPending();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field is required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File size must be 10 MB or less" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${teacher.id}/profile-${Date.now()}.${ext}`;

  const uploadTimer = startPerfTimer("supabase.teacherProfile.photo.upload", {
    teacherId: teacher.id,
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
    "supabase.teacherProfile.photo.getPublicUrl",
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
        where: { teacherId: teacher.id },
        create: { teacherId: teacher.id, photoUrl },
        update: { photoUrl },
      }),
    { teacherId: teacher.id },
  );

  revalidatePublicCms(PUBLIC_TEACHERS_CACHE_TAG);
  return NextResponse.json({ photoUrl });
}
