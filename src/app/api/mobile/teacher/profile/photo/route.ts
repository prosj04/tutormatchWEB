import { NextResponse } from "next/server";

import { requireMobileTeacherAllowPending } from "@/lib/mobile-auth";
import { PUBLIC_TEACHERS_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { TEACHER_PHOTO_BUCKET } from "@/lib/supabase-client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** POST /api/mobile/teacher/profile/photo — 강사 본인 프로필 사진 업로드(모바일).
 *  웹 /api/teacher/profile/photo 대응. multipart/form-data(file).
 */
export async function POST(request: Request) {
  const authResult = await requireMobileTeacherAllowPending(request);
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

  const { data, error } = await supabase.storage
    .from(TEACHER_PHOTO_BUCKET)
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const photoUrl = supabase.storage
    .from(TEACHER_PHOTO_BUCKET)
    .getPublicUrl(data.path).data.publicUrl;

  await prisma.teacherProfile.upsert({
    where: { teacherId: teacher.id },
    create: { teacherId: teacher.id, photoUrl },
    update: { photoUrl },
  });

  revalidatePublicCms(PUBLIC_TEACHERS_CACHE_TAG);
  return NextResponse.json({ photoUrl });
}
