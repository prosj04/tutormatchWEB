/**
 * Upload a question image via the server-side API route (POST /api/student/question-images).
 * The server validates auth and uses the service-role key, so the anon key is never
 * used for bucket writes. The `studentId` parameter is kept for API compatibility but
 * is ignored — the server derives the student from the session.
 */
export async function uploadQuestionImage(
  _studentId: string,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/student/question-images", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? "Image upload failed");
  }

  const data = await res.json() as { url: string };
  return data.url;
}

export const TEACHER_PHOTO_BUCKET = "teacher-photos";
export const TEACHER_DOCUMENT_BUCKET = "teacher-documents";
