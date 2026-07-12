import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/teacher-auth";
import { getPendingConfirmLessons } from "@/lib/lesson-confirm";

/** GET /api/teacher/lessons/pending-confirm
 *  종료된(확인 대기) 수업 목록. 수업 확인 제도 카드용.
 */
export async function GET() {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const lessons = await getPendingConfirmLessons(teacher.id);
  return NextResponse.json({ lessons });
}
