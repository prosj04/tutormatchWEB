import { NextResponse } from "next/server";

import { requireStudent } from "@/lib/student-auth";
import { acceptTeacherStudentMatch } from "@/lib/teacher-student-match";

/** POST /api/matches/[matchId]/accept — 웹 학생이 배정 선생님 수락 */
export async function POST(
  request: Request,
  { params }: { params: { matchId: string } },
) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const result = await acceptTeacherStudentMatch(
    params.matchId,
    student.id,
    student.name,
  );

  if (!result.ok) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({ match: result.match });
}
