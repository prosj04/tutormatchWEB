import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/student-auth";

export async function GET() {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;

  const managers = await prisma.teacher.findMany({
    where: {
      approved: true,
      user: { role: "MANAGER" },
    },
    include: { profile: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    managers: managers.map((m) => ({
      id: m.id,
      name: m.name,
      subjects: m.subjects,
      intro: m.profile?.intro?.trim() || m.bio,
      photoUrl: m.profile?.photoUrl ?? null,
    })),
  });
}
