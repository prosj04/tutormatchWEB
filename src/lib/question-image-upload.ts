import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { QUESTION_IMAGE_BUCKET } from "@/lib/supabase-client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export type QuestionImageUploadResult =
  | { ok: true; url: string }
  | { ok: false; status: number; error: string };

/**
 * 질문 첨부 이미지를 Supabase Storage에 올리고 앱 내부 URL을 돌려준다.
 * 웹(`/api/student/question-images`)·모바일(`/api/mobile/question-images`) 공용 —
 * 용량·MIME 허용 목록이 두 벌로 갈라지지 않게 검증까지 여기서 한다.
 */
export async function uploadQuestionImage(
  studentId: string,
  file: unknown,
): Promise<QuestionImageUploadResult> {
  if (!(file instanceof File)) {
    return { ok: false, status: 400, error: "file field is required" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, status: 400, error: "File size must be 10 MB or less" };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      ok: false,
      status: 400,
      error: "Only JPEG, PNG, WebP, and HEIC images are allowed",
    };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${studentId}/${Date.now()}.${ext}`;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(QUESTION_IMAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Question image upload failed", error);
    return { ok: false, status: 500, error: "업로드에 실패했습니다" };
  }

  return { ok: true, url: `/api/question-images/${data.path}` };
}
