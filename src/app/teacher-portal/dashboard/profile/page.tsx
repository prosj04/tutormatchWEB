import { redirect } from "next/navigation";

import { AccountDeleteSection } from "@/components/account/AccountDeleteSection";
import { TeacherProfileEditor } from "@/components/teacher-portal/TeacherProfileEditor";
import { auth } from "@/auth";
import { startPerfTimer, timeAsync } from "@/lib/perf-timer";
import { isPortalTeacherRole } from "@/lib/portal-roles";
import { prisma } from "@/lib/prisma";
import { profileToFormData } from "@/lib/teacher-profile-types";

export const metadata = {
  title: "프로필 관리",
};

export default async function TeacherProfilePage() {
  const timer = startPerfTimer("page.teacherPortalProfile.total");
  const session = await auth();
  if (!session?.user?.id || !isPortalTeacherRole(session.user.role)) {
    timer.end({ redirected: true, reason: "unauthorized" });
    redirect("/teacher-portal");
  }

  const teacher = await timeAsync(
    "prisma.teacher.findUnique.portalProfile",
    () =>
      prisma.teacher.findUnique({
        where: { userId: session.user.id },
        include: { profile: true },
      }),
    { userId: session.user.id },
  );

  if (!teacher) {
    timer.end({ redirected: true, reason: "teacher-not-found" });
    redirect("/teacher-portal");
  }

  const subjects = teacher.subjects
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const initialForm = profileToFormData(teacher.profile);

  const page = (
    <div>
      <h1 className="text-2xl font-black text-text-primary sm:text-3xl">프로필 관리</h1>
      <p className="mt-2 text-sm text-text-secondary">
        강사 목록 페이지에 표시될 프로필을 편집합니다. 변경 사항은 저장 즉시 반영됩니다.
      </p>
      <div className="mt-8">
        <TeacherProfileEditor
          teacherId={teacher.id}
          teacherName={teacher.name}
          subjects={subjects}
          gender={teacher.gender}
          initialForm={initialForm}
        />
      </div>
      <AccountDeleteSection />
    </div>
  );
  timer.end({ teacherId: teacher.id });
  return page;
}
