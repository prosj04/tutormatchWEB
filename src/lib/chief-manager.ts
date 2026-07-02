import { getDefaultManager } from "@/lib/default-manager";
import { prisma } from "@/lib/prisma";

const chiefManagerSelect = {
  id: true,
  name: true,
  user: { select: { id: true, email: true } },
} as const;

/** 결제·즉시 등록 시 배정할 Chief 매니저 (env → CHIEF_MANAGER 역할 → 이름 Chief → 대표 매니저 폴백) */
export async function getChiefManager() {
  const chiefEmail = process.env.CHIEF_MANAGER_EMAIL?.trim();
  if (chiefEmail) {
    const byEmail = await prisma.teacher.findFirst({
      where: {
        approved: true,
        user: { role: { in: ["CHIEF_MANAGER", "MANAGER"] }, email: chiefEmail },
      },
      select: chiefManagerSelect,
    });
    if (byEmail) return byEmail;
  }

  const byRole = await prisma.teacher.findFirst({
    where: {
      approved: true,
      user: { role: "CHIEF_MANAGER" },
    },
    orderBy: { user: { createdAt: "asc" } },
    select: chiefManagerSelect,
  });
  if (byRole) return byRole;

  const byName = await prisma.teacher.findFirst({
    where: {
      approved: true,
      user: { role: { in: ["CHIEF_MANAGER", "MANAGER"] } },
      OR: [
        { name: { equals: "Chief_manager", mode: "insensitive" } },
        { name: { contains: "Chief_manager", mode: "insensitive" } },
        { name: { contains: "Chief", mode: "insensitive" } },
      ],
    },
    orderBy: { user: { createdAt: "asc" } },
    select: chiefManagerSelect,
  });
  if (byName) return byName;

  return getDefaultManager();
}
