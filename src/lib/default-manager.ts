import { prisma } from "@/lib/prisma";

/** 대표 매니저: 승인된 MANAGER 중 가장 먼저 등록된 계정 (또는 env 지정) */
export async function getDefaultManager() {
  const preferredEmail = process.env.DEFAULT_MANAGER_EMAIL?.trim();
  if (preferredEmail) {
    const byEmail = await prisma.teacher.findFirst({
      where: {
        approved: true,
        user: { role: { in: ["CHIEF_MANAGER", "MANAGER"] }, email: preferredEmail },
      },
      include: { user: { select: { id: true } } },
    });
    if (byEmail) return byEmail;
  }

  const manager = await prisma.teacher.findFirst({
    where: { approved: true, user: { role: { in: ["CHIEF_MANAGER", "MANAGER"] } } },
    orderBy: { user: { createdAt: "asc" } },
    include: { user: { select: { id: true } } },
  });

  if (!manager) {
    throw new Error("NO_DEFAULT_MANAGER");
  }
  return manager;
}
