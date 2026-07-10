import { NextResponse } from "next/server";

import { requireMobileManager } from "@/lib/mobile-auth";
import { getManagerMonitoringData } from "@/lib/manager-portal-data";

export async function GET(request: Request) {
  const authResult = await requireMobileManager(request);
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  return NextResponse.json(await getManagerMonitoringData(teacher.id));
}
