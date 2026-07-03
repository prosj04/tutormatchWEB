import { redirect } from "next/navigation";

import { PublicShell } from "@/components/layout/PublicShell";
import { TeacherPortalLoginClient } from "@/components/teacher-portal/TeacherPortalLoginClient";
import { auth } from "@/auth";

export const metadata = {
  title: "선생님 포털",
};

export default async function TeacherPortalPage() {
  const session = await auth();
  if (session?.user?.role === "TEACHER" || session?.user?.role === "MANAGER" || session?.user?.role === "CHIEF_MANAGER") {
    redirect("/teacher-portal/dashboard");
  }
  return (
    <PublicShell>
      <TeacherPortalLoginClient />
    </PublicShell>
  );
}
