import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { uploadQuestionImage } from "@/lib/question-image-upload";

/** POST /api/mobile/question-images
 *  웹 /api/student/question-images와 동일 검증·업로드(uploadQuestionImage 공용)를
 *  Bearer 인증으로. 반환 url은 /api/question-images/... 앱 내부 경로다.
 */
export async function POST(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const result = await uploadQuestionImage(student.id, formData.get("file"));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ url: result.url });
}
