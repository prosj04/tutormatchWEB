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
    <section className="page on" id="pg-profile">
      <div className="crumb">/teacher-portal/dashboard/profile</div>
      <h1>프로필</h1>
      <p className="sub">학생·학부모에게 보여질 프로필과 제출 서류를 관리합니다.</p>
      <div className="sec">
        <TeacherProfileEditor
          teacherName={teacher.name}
          subjects={subjects}
          gender={teacher.gender}
          initialForm={initialForm}
        />
      </div>
      <div className="sec">
        <AccountDeleteSection />
      </div>
    </section>
  );
  timer.end({ teacherId: teacher.id });
  return page;
}
