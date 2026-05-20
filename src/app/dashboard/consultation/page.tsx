import { redirect } from "next/navigation";

import { ConsultationBookingPage } from "@/components/dashboard/ConsultationBookingPage";
import { auth } from "@/auth";
import { getConsultationBookingDto } from "@/lib/consultation-booking-dto";
import { prisma } from "@/lib/prisma";

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
    include: { teachers: { where: { isActive: true } } },
  });

  if (!student) {
    redirect("/?signup=1");
  }

  if (student.teachers.length > 0) {
    redirect("/dashboard");
  }

  const initialBooking = await getConsultationBookingDto(student.id);
  const openVisitFromUrl = isVisitOpenFlag(searchParams.visit);

  return (
    <ConsultationBookingPage
      studentName={student.name}
      initialBooking={initialBooking}
      openVisitFromUrl={openVisitFromUrl}
    />
  );
}
