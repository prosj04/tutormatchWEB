import { NextResponse } from "next/server";

import { requireMobileManager } from "@/lib/mobile-auth";
import { getManagerWaitingConsultations } from "@/lib/manager-portal-data";

export async function GET(request: Request) {
  const authResult = await requireMobileManager(request);
  if ("error" in authResult) return authResult.error;

  return NextResponse.json({
    bookings: await getManagerWaitingConsultations(),
  });
}
