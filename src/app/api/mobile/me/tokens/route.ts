import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { getTokenWallet } from "@/lib/mobile-token-wallet";

/** GET /api/mobile/me/tokens — AI 질답 토큰 잔여 */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const wallet = await getTokenWallet(student.id);
  return NextResponse.json(wallet);
}
