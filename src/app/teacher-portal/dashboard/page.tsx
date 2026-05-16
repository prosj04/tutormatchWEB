import { redirect } from "next/navigation";

import { TeacherDashboardContent } from "@/components/teacher-portal/TeacherDashboardContent";
import { auth } from "@/auth";
import { isPortalTeacherRole } from "@/lib/portal-roles";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "선생님 대시보드",
};

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || !isPortalTeacherRole(session.user.role)) {
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
    <div>
      <h1 className="text-2xl font-black text-text-primary sm:text-3xl">선생님 대시보드</h1>
      <p className="mt-2 text-text-secondary">{teacher.name}님, 환영합니다.</p>
      <div className="mt-8 max-w-2xl">
        <TeacherDashboardContent
          email={teacher.user.email}
          teacher={{
            name: teacher.name,
            phone: teacher.phone,
            subjects: teacher.subjects,
            approved: teacher.approved,
          }}
        />
      </div>
    </div>
  );
}
