import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** GET /api/mobile/reports?month=YYYY-MM — 월간 리포트 (없으면 최신) */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (month !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json(
      { error: "month 형식이 올바르지 않습니다 (YYYY-MM)" },
      { status: 400 },
    );
  }

  const report = await prisma.monthlyReport.findFirst({
    where: {
      studentId: student.id,
      ...(month ? { month } : {}),
    },
    orderBy: { month: "desc" },
  });

  if (!report) {
    return NextResponse.json({ report: null });
  }

  return NextResponse.json({
    report: {
      month: report.month,
      summary: report.summary,
      weakTypes: parseJsonArray(report.weakTypes),
      detail: report.detail,
    },
  });
}
