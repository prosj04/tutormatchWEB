import { NextResponse } from "next/server";

import { getManagerMonitoringDetail } from "@/lib/manager-portal-data";
import { requireManager } from "@/lib/manager-auth";

export async function GET(request: Request) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  const detail = await getManagerMonitoringDetail(teacher.id, studentId);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
