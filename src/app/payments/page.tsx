import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getV2PlanById, PRICING_PLANS } from "@/lib/pricing-plans";
import { formatKRW } from "@/lib/format-won";
import { BillingManageSection } from "@/components/payments/BillingManageSection";

export const metadata = { title: "결제·구독 내역" };

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "구독중", cls: "bst acc" },
  PAST_DUE: { label: "미납", cls: "bst warn" },
  PAUSED: { label: "일시정지", cls: "bst mut" },
  CANCELLED: { label: "해지됨", cls: "bst mut" },
};

function getPlanInfo(planId: string): { title: string; price: number | null } {
  const v2 = getV2PlanById(planId);
  if (v2) {
    return { title: `${v2.title} · 월 ${v2.monthlyHours}시간`, price: v2.priceKrw };
  }
  const plan = PRICING_PLANS.find((p) => p.id === planId);
  if (!plan) return { title: planId, price: null };
  // LEGACY v1 계산식 — 신규 결제 발급 금지, 예전 구독 이력 표시용.
  const price = plan.sessions * plan.subjects * (plan.sessions === 4 ? 100_000 : 90_000);
  return { title: `${plan.title} · ${plan.subtitle}`, price };
}

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function formatShortDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams?: { billing?: string | string[] };
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/teacher-portal/dashboard");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });
  if (!student) redirect("/?signup=1");

  const rawBilling = searchParams?.billing;
  const billingParam = Array.isArray(rawBilling)
    ? rawBilling[0] ?? null
    : rawBilling ?? null;

  const [subscriptions, wallet, paymentCompletions, billingProfile] = await Promise.all([
    prisma.subscription.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tokenWallet.findFirst({
      where: { studentId: student.id },
      orderBy: { month: "desc" },
      select: { used: true, quota: true, month: true },
    }),
    prisma.paymentCompletion.findMany({
      where: {
        studentId: student.id,
        status: { in: ["COMPLETED", "REFUNDED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.billingProfile.findUnique({
      where: { studentId: student.id },
      select: {
        cardCompany: true,
        cardNumberMasked: true,
        autoRenew: true,
      },
    }),
  ]);

  const activeSubscription = subscriptions.find((s) => s.status === "ACTIVE") ?? null;
  const pausedSubscription = subscriptions.find((s) => s.status === "PAUSED") ?? null;
  const currentSubscription = activeSubscription ?? pausedSubscription;

  return (
    <section className="page on" id="pg-payments" data-screen-label="결제 내역">
      <div className="crumb">/payments</div>
      <h1>결제 내역</h1>
      <p className="sub">결제·환불 이력과 구독 상태를 확인하세요.</p>

      {/* 현재 구독 */}
      <div className="sec card">
        {currentSubscription ? (
          (() => {
            const info = getPlanInfo(currentSubscription.plan);
            const badge = STATUS_LABEL[currentSubscription.status] ?? {
              label: currentSubscription.status,
              cls: "bst mut",
            };
            const priceMeta = info.price ? `${formatKRW(info.price)}/월 · ` : "";
            const dateMeta = currentSubscription.periodEnd
              ? `다음 결제 ${formatDate(currentSubscription.periodEnd)}`
              : `시작 ${formatDate(currentSubscription.periodStart)}`;
            return (
              <div className="row">
                <div className="g">
                  <b>{info.title}</b>
                  <p>
                    {priceMeta}
                    {dateMeta}
                  </p>
                  {wallet ? (
                    <p>
                      AI 질답 토큰 {wallet.quota - wallet.used} / {wallet.quota} 잔여 ({wallet.month})
                    </p>
                  ) : null}
                </div>
                <span className={badge.cls}>{badge.label}</span>
                <Link className="btn ghost sm" href="/checkout">
                  플랜 변경
                </Link>
              </div>
            );
          })()
        ) : (
          <div className="row">
            <div className="g">
              <b>현재 활성 구독이 없습니다</b>
              <p>수업을 신청하면 여기에 구독 상태가 표시됩니다.</p>
            </div>
            <Link className="btn sec sm" href="/checkout">
              수업 신청
            </Link>
          </div>
        )}
      </div>

      {/* 자동결제 관리 (Toss 위젯 — 기존 로직 유지) */}
      <div className="sec" data-portal-content>
        <BillingManageSection
          customerKey={`student-${student.id}`}
          profile={billingProfile}
          billingParam={billingParam}
        />
      </div>

      {/* 결제·환불 내역 */}
      {paymentCompletions.length > 0 ? (
        <div className="sec card" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>일자</th>
                <th>내역</th>
                <th>금액</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paymentCompletions.map((payment) => {
                const info = getPlanInfo(payment.plan);
                const isRefunded = payment.status === "REFUNDED";
                const amount = payment.amount ?? null;
                const displayAmount =
                  amount == null
                    ? "-"
                    : isRefunded
                      ? `-${formatKRW(Math.abs(amount))}`
                      : formatKRW(amount);
                return (
                  <tr key={payment.id}>
                    <td>{formatShortDate(payment.createdAt)}</td>
                    <td>
                      <b>{info.title}</b>
                    </td>
                    <td className="num">{displayAmount}</td>
                    <td>
                      <span className={isRefunded ? "bst mut" : "bst acc"}>
                        {isRefunded ? "환불" : "완료"}
                      </span>
                    </td>
                    <td>
                      {payment.cashReceiptUrl ? (
                        <a href={payment.cashReceiptUrl} target="_blank" rel="noopener noreferrer">
                          현금영수증
                        </a>
                      ) : (
                        <span style={{ color: "var(--mut-2)" }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* 구독 이력 */}
      {subscriptions.length > 0 ? (
        <div className="sec card">
          <h2 style={{ fontSize: "15px", fontWeight: 700, padding: "18px 20px 4px" }}>구독 이력</h2>
          {subscriptions.map((s) => {
            const info = getPlanInfo(s.plan);
            const badge = STATUS_LABEL[s.status] ?? { label: s.status, cls: "bst mut" };
            return (
              <div key={s.id} className="row">
                <div className="g">
                  <b>{info.title}</b>
                  <p>{formatDate(s.periodStart)}</p>
                </div>
                <span className={badge.cls}>{badge.label}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
