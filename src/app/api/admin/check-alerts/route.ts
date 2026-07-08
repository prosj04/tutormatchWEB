import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { runAlertChecks } from "@/lib/run-alert-checks";

export async function POST() {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const result = await runAlertChecks();

  return NextResponse.json({
    checked: result.questionsChecked + result.waitingBookingsChecked,
    notificationsCreated: result.notificationsCreated,
    questionsChecked: result.questionsChecked,
    waitingBookingsChecked: result.waitingBookingsChecked,
    weeklyStudentsChecked: result.weeklyStudentsChecked,
    weeklyCheckRan: result.weeklyCheckRan,
  });
}
