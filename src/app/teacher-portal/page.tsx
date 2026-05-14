import { redirect } from "next/navigation";

import { TeacherPortalLoginClient } from "@/components/teacher-portal/TeacherPortalLoginClient";
import { auth } from "@/auth";

export const metadata = {
  title: "선생님 포털",
};

export default async function TeacherPortalPage() {
  const session = await auth();
  if (session?.user?.role === "TEACHER") {
    redirect("/teacher-portal/dashboard");
  }
  return <TeacherPortalLoginClient />;
}
