import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getV2PlanById, PRICING_PLANS } from "@/lib/pricing-plans";
import { formatKRW } from "@/lib/format-won";
import { PaymentsPageHeader } from "@/components/payments/PaymentsPageHeader";
import { BillingManageSection } from "@/components/payments/BillingManageSection";

export const metadata = { title: "결제·구독 내역" };

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "구독 중", className: "badge-status-assigned" },
  PAST_DUE: { label: "미납", className: "badge-status-waiting" },
  CANCELLED: { label: "해지됨", className: "badge-status-cancelled" },
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

  return (
    <div className="min-h-screen bg-background" data-portal-content>
      <PaymentsPageHeader studentName={student.name} />

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-8 space-y-8">
        {/* 현재 구독 */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-text-primary">현재 구독</h2>
          {activeSubscription ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              {(() => {
                const info = getPlanInfo(activeSubscription.plan);
                const statusInfo = STATUS_LABEL[activeSubscription.status] ?? { label: activeSubscription.status, className: "" };
                return (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-text-primary">{info.title}</p>
                        {info.price && (
                          <p className="mt-1 text-2xl font-black tabular-nums text-primary">
                            {formatKRW(info.price)}
                            <span className="text-sm font-normal text-text-secondary"> / 월</span>
                          </p>
                        )}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="mt-5 space-y-1 text-sm text-text-secondary">
                      <p>시작일: <span className="font-medium text-text-primary">{formatDate(activeSubscription.periodStart)}</span></p>
                      {activeSubscription.periodEnd && (
                        <p>만료일: <span className="font-medium text-text-primary">{formatDate(activeSubscription.periodEnd)}</span></p>
                      )}
                    </div>
                    {wallet && (
                      <div className="mt-5 rounded-xl bg-surface px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">AI 질답 토큰 ({wallet.month})</p>
                        <p className="mt-1 text-xl font-black tabular-nums text-primary">
                          {wallet.quota - wallet.used}
                          <span className="text-sm font-normal text-text-secondary"> / {wallet.quota} 잔여</span>
                        </p>
                      </div>
                    )}
                    <p className="mt-4 text-sm text-text-secondary">
                      구독 일시정지가 필요하시면 담당 매니저에게 문의해 주세요.
                    </p>
                  </>
                );
              })()}
            </div>
          ) : pausedSubscription ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
              {(() => {
                const info = getPlanInfo(pausedSubscription.plan);
                return (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-text-primary">{info.title}</p>
                      </div>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        일시정지 중
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-orange-700">
                      일시정지 중 — 재개는 매니저에게 문의해 주세요.
                      {pausedSubscription.pausedUntil && (
                        <> 일시정지 예정 종료: <span className="font-semibold">{formatDate(pausedSubscription.pausedUntil)}</span></>
                      )}
                    </p>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-surface px-6 py-12 text-center">
              <p className="text-sm text-text-secondary">현재 활성 구독이 없습니다.</p>
              <Link
                href="/checkout"
                className="mt-4 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                수업 신청하기
              </Link>
            </div>
          )}
        </section>

        {/* 자동결제 관리 */}
        <BillingManageSection
          customerKey={`student-${student.id}`}
          profile={billingProfile}
          billingParam={billingParam}
        />

        {/* 구독 이력 */}
        {subscriptions.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-bold text-text-primary">구독 이력</h2>
            <ul className="space-y-3">
              {subscriptions.map((s) => {
                const info = getPlanInfo(s.plan);
                const statusInfo = STATUS_LABEL[s.status] ?? { label: s.status, className: "" };
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-surface px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{info.title}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{formatDate(s.periodStart)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 결제 내역 */}
        {paymentCompletions.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-bold text-text-primary">결제 내역</h2>
            <ul className="space-y-3">
              {paymentCompletions.map((payment) => {
                const info = getPlanInfo(payment.plan);
                const isRefunded = payment.status === "REFUNDED";
                return (
                  <li
                    key={payment.id}
                    className="rounded-xl border border-gray-100 bg-surface px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{info.title}</p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {formatDate(payment.createdAt)}
                        </p>
                        {payment.amount != null && (
                          <p className="mt-1 text-base font-bold tabular-nums text-text-primary">
                            {formatKRW(payment.amount)}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isRefunded
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isRefunded ? "환불" : "결제완료"}
                      </span>
                    </div>
                    {payment.cashReceiptUrl && (
                      <a
                        href={payment.cashReceiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                      >
                        현금영수증 보기 →
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="text-center">
          <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
            ← 학습 플래너로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
