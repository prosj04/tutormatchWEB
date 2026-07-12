import { redirect } from "next/navigation";

import { TeacherApprovalLock } from "@/components/teacher-portal/TeacherApprovalLock";
import { TeacherSettlementsClient } from "@/components/teacher-portal/TeacherSettlementsClient";
import { auth } from "@/auth";
import { isPortalTeacherRole } from "@/lib/portal-roles";
import { getTeacherByUserId } from "@/lib/get-teacher-cache";

export const metadata = {
  title: "정산",
};

export default async function TeacherSettlementsPage() {
  const session = await auth();
  if (!session?.user?.id || !isPortalTeacherRole(session.user.role)) {
    redirect("/teacher-portal");
  }

  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) {
    redirect("/teacher-portal");
  }

  // 미승인 강사는 운영 기능 잠금(E7과 정합). MANAGER 역할은 approved 무관 통과.
  if (session.user.role === "TEACHER" && !teacher.approved) {
    return <TeacherApprovalLock />;
  }

  return <TeacherSettlementsClient />;
}
