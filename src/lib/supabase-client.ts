import { createClient } from "@supabase/supabase-js";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase client env vars are not configured");
  }
  return createClient(url, anonKey);
}

const QUESTION_IMAGE_BUCKET = "question-images";

export async function uploadQuestionImage(
  studentId: string,
  file: File,
): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${studentId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(QUESTION_IMAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from(QUESTION_IMAGE_BUCKET)
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}

export const TEACHER_PHOTO_BUCKET = "teacher-photos";
export const TEACHER_DOCUMENT_BUCKET = "teacher-documents";

export async function uploadTeacherPhoto(
  teacherId: string,
  file: File,
): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const path = `${teacherId}/profile.jpg`;

  const { data, error } = await supabase.storage
    .from(TEACHER_PHOTO_BUCKET)
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from(TEACHER_PHOTO_BUCKET)
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}

export async function uploadTeacherDocument(
  teacherId: string,
  file: File,
  type: "resume" | "document",
): Promise<string> {
  if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
    throw new Error("PDF 또는 이미지 파일만 업로드할 수 있습니다.");
  }

  const supabase = createSupabaseBrowserClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${teacherId}/${type}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(TEACHER_DOCUMENT_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  return data.path;
}
