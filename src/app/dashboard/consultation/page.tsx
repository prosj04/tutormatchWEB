import { redirect } from "next/navigation";

import { ConsultationBookingPage } from "@/components/dashboard/ConsultationBookingPage";
import { auth } from "@/auth";
import { getConsultationBookingDto } from "@/lib/consultation-booking-dto";
import { prisma } from "@/lib/prisma";
import { resolveStudentJourneyStage } from "@/lib/student-journey";

export const metadata = {
  title: "상담 예약",
};

function isVisitOpenFlag(visit: string | string[] | undefined): boolean {
  if (visit === "1") return true;
  return Array.isArray(visit) && visit[0] === "1";
}

export default async function ConsultationPage({
  searchParams,
}: {
  searchParams: { visit?: string | string[] };
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/teacher-portal/dashboard");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
  });

  if (!student) {
    redirect("/?signup=1");
  }

  const journeyStage = await resolveStudentJourneyStage(student.id);
  if (journeyStage === "ACTIVE") {
    redirect("/dashboard");
  }

  const [initialBooking, pendingMatch] = await Promise.all([
    getConsultationBookingDto(student.id),
    prisma.teacherStudent.findFirst({
      where: {
        studentId: student.id,
        matchStatus: "PENDING_STUDENT_ACCEPT",
      },
      select: {
        id: true,
        subjects: true,
        matchReason: true,
        teacher: { select: { name: true } },
      },
    }),
  ]);
  const openVisitFromUrl = isVisitOpenFlag(searchParams.visit);

  return (
    <ConsultationBookingPage
      studentName={student.name}
      initialBooking={initialBooking}
      openVisitFromUrl={openVisitFromUrl}
      initialPendingMatch={
        pendingMatch
          ? {
              matchId: pendingMatch.id,
              subjects: pendingMatch.subjects,
              teacherName: pendingMatch.teacher.name,
              matchReason: pendingMatch.matchReason,
            }
          : null
      }
    />
  );
}
