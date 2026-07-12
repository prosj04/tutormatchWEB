import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책).
 * 세션 role이 JWT 만료까지 유효한 결함을 막기 위해 user를 재조회한다.
 * 유효하면 null, 무효하면 401 응답을 반환한다.
 */
async function revalidateUser(sessionRole: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { deletedAt: true, role: true },
  });
  if (!user || user.deletedAt !== null || user.role !== sessionRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  const invalid = await revalidateUser(session.user.role, session.user.id);
  if (invalid) return { error: invalid } as const;
  return { session, userId: session.user.id } as const;
}

export async function requireChiefManagerOrAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "CHIEF_MANAGER") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  const invalid = await revalidateUser(session.user.role, session.user.id);
  if (invalid) return { error: invalid } as const;
  return { session, userId: session.user.id } as const;
}

export async function requireManagerOrAbove() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "CHIEF_MANAGER" && role !== "MANAGER") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  const invalid = await revalidateUser(role, session.user.id);
  if (invalid) return { error: invalid } as const;
  return { session, userId: session.user.id } as const;
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export async function adminCount() {
  return prisma.user.count({ where: { role: { in: ["ADMIN", "CHIEF_MANAGER"] } } });
}
