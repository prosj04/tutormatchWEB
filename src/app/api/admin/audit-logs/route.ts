import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const take = Math.min(100, Math.max(1, Number(searchParams.get("take")) || 50));
  const skip = (page - 1) * take;
  const targetType = searchParams.get("targetType") ?? undefined;

  const where = targetType ? { targetType } : undefined;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.auditLog.count({ where }),
  ]);

  // G-8adm: actorUserId/targetId만 저장되어 있어 표시가 불친절 — 이름(이메일)을
  // 조회해 응답에 합류한다. 필요한 ID만 배치 조회 후 맵으로 붙여, 로그 건수와
  // 무관하게 targetType별 최대 1쿼리씩만 발생하도록 한다. 매핑 실패 시 ID 유지.
  const actorIds = Array.from(new Set(logs.map((log) => log.actorUserId)));
  const idsByTargetType = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!idsByTargetType.has(log.targetType)) {
      idsByTargetType.set(log.targetType, new Set());
    }
    idsByTargetType.get(log.targetType)!.add(log.targetId);
  }

  const targetIdsOf = (type: string) =>
    Array.from(idsByTargetType.get(type) ?? []);

  const [actors, users, students, teachers] = await Promise.all([
    actorIds.length
      ? prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, email: true },
        })
      : Promise.resolve([]),
    targetIdsOf("User").length
      ? prisma.user.findMany({
          where: { id: { in: targetIdsOf("User") } },
          select: { id: true, email: true },
        })
      : Promise.resolve([]),
    targetIdsOf("Student").length
      ? prisma.student.findMany({
          where: { id: { in: targetIdsOf("Student") } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    targetIdsOf("Teacher").length
      ? prisma.teacher.findMany({
          where: { id: { in: targetIdsOf("Teacher") } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const actorNameById = new Map(actors.map((u) => [u.id, u.email]));
  const userEmailById = new Map(users.map((u) => [u.id, u.email]));
  const studentNameById = new Map(students.map((s) => [s.id, s.name]));
  const teacherNameById = new Map(teachers.map((t) => [t.id, t.name]));

  function resolveTargetName(targetType: string, targetId: string): string | null {
    switch (targetType) {
      case "User":
        return userEmailById.get(targetId) ?? null;
      case "Student":
        return studentNameById.get(targetId) ?? null;
      case "Teacher":
        return teacherNameById.get(targetId) ?? null;
      default:
        // PaymentCompletion·Subscription 등은 표시명이 없어 ID를 유지한다.
        return null;
    }
  }

  const enrichedLogs = logs.map((log) => ({
    ...log,
    actorName: actorNameById.get(log.actorUserId) ?? null,
    targetName: resolveTargetName(log.targetType, log.targetId),
  }));

  return NextResponse.json({
    logs: enrichedLogs,
    total,
    page,
    take,
    totalPages: Math.ceil(total / take),
  });
}
