import { PublicShell } from "@/components/layout/PublicShell";
import { TeacherPortalApplyClient } from "@/components/teacher-portal/TeacherPortalApplyClient";

export const metadata = {
  title: "선생님 가입 신청",
};

export default function TeacherPortalApplyPage() {
  return (
    <PublicShell>
      <TeacherPortalApplyClient />
    </PublicShell>
  );
}
