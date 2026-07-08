import { NextResponse } from "next/server";

import { requireStudent } from "@/lib/student-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { QUESTION_IMAGE_BUCKET } from "@/lib/supabase-client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

/** POST /api/student/question-images
 *  Accepts multipart/form-data with a "file" field.
 *  Validates and uploads the image to Supabase Storage via the admin (service-role) client.
 *  Returns { url } — an authenticated app URL for the uploaded image.
 */
export async function POST(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field is required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size must be 10 MB or less" },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, and HEIC images are allowed" },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${student.id}/${Date.now()}.${ext}`;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(QUESTION_IMAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Question image upload failed", error);
    return NextResponse.json({ error: "업로드에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ url: `/api/question-images/${data.path}` });
}
