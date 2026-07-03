import { prisma } from "@/lib/prisma";

/** "YYYY-MM" (KST 기준 단순 처리) */
export function currentMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** 활성 구독 플랜으로 월 토큰 할당량 산정 (구독 없으면 체험 10) */
function quotaForPlan(plan: string | null): number {
  if (!plan) return 10;
  // v2 id: "mid-w2h3" / "high-w1h2" 등 — 주2회면 60, 주1회면 30.
  if (plan.startsWith("mid-") || plan.startsWith("high-")) {
    return plan.includes("w2") ? 60 : 30;
  }
  // LEGACY v1 id: "4-1" | "8-1" | "4-2" | "8-2" → 앞자리=월 횟수
  const base = plan.startsWith("8") ? 60 : 30;
  return base;
}

export type WalletState = {
  month: string;
  used: number;
  quota: number;
  remaining: number;
};

export async function getTokenWallet(studentId: string): Promise<WalletState> {
  const month = currentMonth();

  const sub = await prisma.subscription.findFirst({
    where: { studentId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { plan: true },
  });
  const quota = quotaForPlan(sub?.plan ?? null);

  const wallet = await prisma.tokenWallet.upsert({
    where: { studentId_month: { studentId, month } },
    create: { studentId, month, used: 0, quota },
    update: { quota },
  });

  return {
    month,
    used: wallet.used,
    quota: wallet.quota,
    remaining: Math.max(0, wallet.quota - wallet.used),
  };
}

/** 토큰 차감. 잔여 부족 시 false (차감 안 함). */
export async function consumeToken(
  studentId: string,
  amount = 1,
): Promise<{ ok: boolean; wallet: WalletState }> {
  const wallet = await getTokenWallet(studentId);
  if (wallet.remaining < amount) {
    return { ok: false, wallet };
  }
  const updated = await prisma.tokenWallet.update({
    where: { studentId_month: { studentId, month: wallet.month } },
    data: { used: { increment: amount } },
  });
  return {
    ok: true,
    wallet: {
      month: wallet.month,
      used: updated.used,
      quota: updated.quota,
      remaining: Math.max(0, updated.quota - updated.used),
    },
  };
}
