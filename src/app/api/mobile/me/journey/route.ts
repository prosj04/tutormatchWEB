import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { getStudentJourneySnapshot, JOURNEY_STAGE_COPY } from "@/lib/student-journey";

/** GET /api/mobile/me/journey — 학생 학습 단계 + 상담 상태 스냅샷 */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const snapshot = await getStudentJourneySnapshot(student.id);

  return NextResponse.json({
    ...snapshot,
    stageCopy: JOURNEY_STAGE_COPY[snapshot.stage],
  });
}
