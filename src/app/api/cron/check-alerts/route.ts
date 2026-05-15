import { NextResponse } from "next/server";

import { runAlertChecks } from "@/lib/run-alert-checks";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  if (request.headers.get("Authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAlertChecks();

  return NextResponse.json({
    checked: result.questionsChecked,
    notificationsCreated: result.notificationsCreated,
    weeklyStudentsChecked: result.weeklyStudentsChecked,
    weeklyCheckRan: result.weeklyCheckRan,
  });
}
