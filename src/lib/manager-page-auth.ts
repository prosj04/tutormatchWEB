import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getTeacherByUserId } from "@/lib/get-teacher-cache";

export async function requireManagerPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    redirect("/teacher-portal/dashboard");
  }

  const teacher = await getTeacherByUserId(session.user.id);

  if (!teacher) {
    redirect("/teacher-portal");
  }

  return { session, teacher };
}
