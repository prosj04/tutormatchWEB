import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { getManagerMonitoringData } from "@/lib/manager-portal-data";

export async function GET() {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  return NextResponse.json(await getManagerMonitoringData(teacher.id));
}
