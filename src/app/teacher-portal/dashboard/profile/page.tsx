import { redirect } from "next/navigation";

import { TeacherProfileEditor } from "@/components/teacher-portal/TeacherProfileEditor";
import { auth } from "@/auth";
import { isPortalTeacherRole } from "@/lib/portal-roles";
import { prisma } from "@/lib/prisma";
import { profileToFormData } from "@/lib/teacher-profile-types";

export const metadata = {
  title: "프로필 관리",
};

export default async function TeacherProfilePage() {
  const session = await auth();
  if (!session?.user?.id || !isPortalTeacherRole(session.user.role)) {
    redirect("/teacher-portal");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { profile: true },
  });

  if (!teacher) {
    redirect("/teacher-portal");
  }

  const subjects = teacher.subjects
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const initialForm = profileToFormData(teacher.profile);

  return (
    <div>
      <h1 className="text-2xl font-black text-text-dark sm:text-3xl">프로필 관리</h1>
      <p className="mt-2 text-sm text-text-mid">
        강사 목록 페이지에 표시될 프로필을 편집합니다. 변경 사항은 저장 즉시 반영됩니다.
      </p>
      <div className="mt-8">
        <TeacherProfileEditor
          teacherId={teacher.id}
          teacherName={teacher.name}
          subjects={subjects}
          initialForm={initialForm}
        />
      </div>
    </div>
  );
}
