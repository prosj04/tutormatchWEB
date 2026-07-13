import { prisma } from "@/lib/prisma";
import { requireRoleRevalidated } from "@/lib/require-role";

export async function requireAdmin() {
  return requireRoleRevalidated(["ADMIN"]);
}

export async function requireChiefManagerOrAdmin() {
  return requireRoleRevalidated(["ADMIN", "CHIEF_MANAGER"]);
}

export async function requireManagerOrAbove() {
  return requireRoleRevalidated(["ADMIN", "CHIEF_MANAGER", "MANAGER"]);
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export async function adminCount() {
  return prisma.user.count({ where: { role: { in: ["ADMIN", "CHIEF_MANAGER"] } } });
}
