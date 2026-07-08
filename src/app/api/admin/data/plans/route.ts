import { NextResponse } from "next/server";

import { parsePagination, requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const q = searchParams.get("q")?.trim() ?? "";
  const from = searchParams.get("from")?.trim() ?? "";
  const to = searchParams.get("to")?.trim() ?? "";

  const where = {
    AND: [
      q ? { student: { name: { contains: q, mode: "insensitive" as const } } } : {},
      from ? { date: { gte: from } } : {},
      to ? { date: { lte: to } } : {},
    ],
  };

  const [total, plans] = await Promise.all([
    prisma.studyPlan.count({ where }),
    prisma.studyPlan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: {
        student: { select: { name: true } },
        tasks: { select: { id: true, title: true, isDone: true, doneAt: true, order: true, planId: true } },
      },
    }),
  ]);

  return NextResponse.json({
    plans: plans.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.isDone).length;
      return {
        id: p.id,
        studentName: p.student.name,
        date: p.date,
        taskCount: total,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
        hasComment: Boolean(p.comment),
        tasks: p.tasks,
        comment: p.comment,
      };
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
