import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { runAlertChecks } from "@/lib/run-alert-checks";

export async function POST() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const result = await runAlertChecks();

  return NextResponse.json({
    checked: result.questionsChecked,
    notificationsCreated: result.notificationsCreated,
    weeklyStudentsChecked: result.weeklyStudentsChecked,
    weeklyCheckRan: result.weeklyCheckRan,
  });
}
