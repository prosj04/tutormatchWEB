import { NextResponse } from "next/server";

import { getManagerWaitingConsultations } from "@/lib/manager-portal-data";
import { requireManager } from "@/lib/manager-auth";

export async function GET() {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;

  return NextResponse.json({
    bookings: await getManagerWaitingConsultations(),
  });
}
