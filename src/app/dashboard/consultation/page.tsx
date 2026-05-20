import { redirect } from "next/navigation";

import { ConsultationBookingPage } from "@/components/dashboard/ConsultationBookingPage";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "상담 예약",
};

export default async function ConsultationPage() {
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

  return <ConsultationBookingPage studentName={student.name} />;
}
