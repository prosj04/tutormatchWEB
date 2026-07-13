import type { Session } from "next-auth";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RoleGuardResult =
  | { readonly error: NextResponse }
  | { readonly session: Session; readonly userId: string };

/**
 * 공통 API 가드: 세션 없으면 401, 역할이 허용 목록에 없으면 403.
 * `if ("error" in r) return r.error` 패턴으로 사용.
 */
export async function requireRole(roles: readonly string[]): Promise<RoleGuardResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (!roles.includes(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  return { session, userId: session.user.id } as const;
}

/**
 * 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책).
 * 세션 role이 JWT 만료까지 유효한 결함을 막기 위해 user를 재조회한다.
 * 유효하면 null, 무효하면 401 응답을 반환한다.
 */
export async function revalidateUser(sessionRole: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { deletedAt: true, role: true },
  });
  if (!user || user.deletedAt !== null || user.role !== sessionRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** requireRole + user 재조회 검증까지 한 번에. */
export async function requireRoleRevalidated(roles: readonly string[]): Promise<RoleGuardResult> {
  const result = await requireRole(roles);
  if ("error" in result) return result;
  const invalid = await revalidateUser(result.session.user.role, result.userId);
  if (invalid) return { error: invalid } as const;
  return result;
}
