import { redirect } from "next/navigation";

import { TeacherDashboardContent } from "@/components/teacher-portal/TeacherDashboardContent";
import { TeacherPortalDashboardTopBar } from "@/components/teacher-portal/TeacherPortalDashboardTopBar";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "선생님 대시보드",
};

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    redirect("/teacher-portal");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true } } },
  });

  if (!teacher) {
    redirect("/teacher-portal");
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-navy">
      <TeacherPortalDashboardTopBar displayName={teacher.name} />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-[4.5rem] sm:px-6 sm:pt-20">
        <TeacherDashboardContent
          email={teacher.user.email}
          teacher={{
            name: teacher.name,
            phone: teacher.phone,
            subjects: teacher.subjects,
            approved: teacher.approved,
          }}
        />
      </main>
    </div>
  );
}
