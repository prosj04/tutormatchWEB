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

  return NextResponse.json({
    logs,
    total,
    page,
    take,
    totalPages: Math.ceil(total / take),
  });
}
