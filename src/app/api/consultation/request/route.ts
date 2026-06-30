import { NextResponse } from "next/server";

import { createConsultationRequest } from "@/lib/student-enrollment";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { logAnalyticsEvent } from "@/lib/analytics";
import { requireStudent } from "@/lib/student-auth";

export async function POST(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let body: { note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const note =
    typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

  try {
    const booking = await createConsultationRequest({
      studentId: student.id,
      studentName: student.name,
      studentGrade: student.grade,
      note,
    });

    logAnalyticsEvent({
      name: ANALYTICS_EVENTS.consultationSubmitted,
      userId: student.userId,
      platform: "web",
    });

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          status: booking.status,
          note: booking.note,
          preferredTimes: [],
          visitPreferredTimes: {},
          createdAt: booking.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ALREADY_ACTIVE") {
      return NextResponse.json(
        { error: "이미 진행 중인 상담 신청이 있습니다." },
        { status: 409 },
      );
    }
    if (msg === "ALREADY_COMPLETED") {
      return NextResponse.json(
        { error: "이미 상담이 완료되어 매칭을 진행 중입니다." },
        { status: 409 },
      );
    }
    throw e;
  }
}
