import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireManagerPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    redirect("/teacher-portal/dashboard");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
  });

  if (!teacher) {
    redirect("/teacher-portal");
  }

  return { session, teacher };
}
