import { NextResponse } from "next/server";

import { authorizeCron } from "@/lib/cron-auth";
import { runAlertChecks } from "@/lib/run-alert-checks";

export async function GET(request: Request) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const result = await runAlertChecks();

  return NextResponse.json({
    checked:
      result.questionsChecked +
      result.qnaMessagesChecked +
      result.waitingBookingsChecked +
      result.pendingMatchesChecked +
      result.firstLessonRemindersChecked +
      result.subscriptionExpiryChecked +
      result.lessonRemindersChecked,
    ...result,
  });
}
