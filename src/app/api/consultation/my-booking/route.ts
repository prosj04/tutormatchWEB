import { NextResponse } from "next/server";

import { getConsultationBookingDto } from "@/lib/consultation-booking-dto";
import { requireStudent } from "@/lib/student-auth";

export async function GET() {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const booking = await getConsultationBookingDto(student.id);

  return NextResponse.json({ booking });
}
