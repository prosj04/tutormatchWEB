import Link from "next/link";

import { listParentChildren, listParentPayments, planPriceKrw } from "@/lib/parent-data";
import { requireParentPage } from "@/lib/parent-page-auth";
import { formatSubscriptionPlanLabel } from "@/lib/subscription-label";

export const dynamic = "force-dynamic";

function formatAmount(amount: number | null): string {
  return `${(amount ?? 0).toLocaleString("ko-KR")}원`;
}

function formatDate(d: Date | string | null): string {
  return d ? new Date(d).toLocaleDateString("ko-KR") : "-";
}

function statusLabel(status: string): string {
  return status === "REFUNDED" ? "환불" : "결제 완료";
}

export default async function ParentPaymentsPage() {
  const { parent } = await requireParentPage();
  const [children, groups] = await Promise.all([
    listParentChildren(parent.id),
    listParentPayments(parent.id),
  ]);

  const rows = groups
    .flatMap((g) =>
      g.payments.map((p) => ({ ...p, studentName: g.studentName })),
    )
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime(),
    );

  // 구독이 있는 자녀는 자녀별 플랜 지면으로, 없는 자녀는 결제 유도 목록으로 분리(C2-8·B-3).
  const subscribedChildren = children.filter((c) => c.subscription);
  const unsubscribedChildren = children.filter((c) => !c.subscription);

  return (
    <section className="page on" id="pg-pay" data-screen-label="학부모 결제">
      <header className="pa-head">
        <div className="crumb">학부모</div>
        <h1>결제</h1>
        <p className="sub">자녀별 플랜·자동갱신·청구 이력. 결제는 학생·학부모 모두 가능합니다.</p>
      </header>

      {subscribedChildren.length === 0 ? (
        <div className="pa-plan">
          <span className="pa-label">현재 플랜</span>
          <b className="pa-plan-name">진행 중인 플랜 없음</b>
          <p className="pa-plan-note">상담 완료 후 플랜이 시작됩니다</p>
        </div>
      ) : (
        subscribedChildren.map((child) => {
          const sub = child.subscription!;
          const isPastDue = sub.status === "PAST_DUE";
          const next = sub.nextPaymentDate;
          const price = planPriceKrw(sub.plan);
          return (
            <div
              key={child.id}
              className={isPastDue ? "pa-plan pa-attention" : "pa-plan"}
            >
              <span className="pa-label">
                {isPastDue ? `${child.name} · 결제 확인 필요` : `${child.name} · 현재 플랜`}
              </span>
              <b className="pa-plan-name">{formatSubscriptionPlanLabel(sub.plan)}</b>
              <p className="pa-plan-note">
                {isPastDue
                  ? "카드 승인에 실패했습니다. 카드를 확인하고 재결제해 주세요."
                  : child.subjects || "상담 완료 후 플랜이 시작됩니다"}
              </p>
              <div className="pa-plan-foot">
                {isPastDue ? (
                  <Link
                    className="btn pri sm"
                    href={`/checkout?studentId=${encodeURIComponent(child.id)}`}
                  >
                    카드 확인·재결제
                  </Link>
                ) : (
                  <>
                    <span>다음 결제</span>
                    <b>
                      {next
                        ? price
                          ? `${formatDate(next)} · ${formatAmount(price)}`
                          : formatDate(next)
                        : "-"}
                    </b>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}

      <div className="sec pa-ruled">
        <div className="pa-renew">
          <div className="g">
            <b>자동 갱신</b>
            <p>{subscribedChildren.length > 0 ? "매월 정기 결제" : "플랜 결제 후 이용 가능"}</p>
          </div>
          <button
            className={subscribedChildren.length > 0 ? "switch on" : "switch"}
            aria-label="자동 갱신"
            disabled
          >
            <i></i>
          </button>
        </div>
        {unsubscribedChildren.map((c) => (
          <div key={c.id} className="pa-renew">
            <div className="g">
              <b>{c.name} 플랜</b>
              <p>배정 완료 후 결제 가능</p>
            </div>
            <Link className="btn pri sm" href={`/checkout?studentId=${encodeURIComponent(c.id)}`}>
              플랜 보기
            </Link>
          </div>
        ))}
      </div>

      <div className="sec pa-ruled">
        <h2>청구 이력</h2>
        {rows.length === 0 ? (
          <div className="pa-rows">
            <div>
              <span className="t">청구 이력이 없습니다</span>
              <span className="d">결제가 완료되면 여기에 영수증과 함께 표시됩니다.</span>
            </div>
          </div>
        ) : (
          <div className="pa-tbl">
            <table className="tbl">
              <thead>
                <tr>
                  <th>일자</th>
                  <th>내역</th>
                  <th>금액</th>
                  <th>상태</th>
                  <th>영수증</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.orderId}>
                    <td className="num">{formatDate(p.completedAt ?? p.createdAt)}</td>
                    <td>
                      {p.studentName} · {formatSubscriptionPlanLabel(p.plan)}
                    </td>
                    <td className="num">{formatAmount(p.amount)}</td>
                    <td>
                      <span className={p.status === "REFUNDED" ? "bst mut" : "bst"}>
                        {statusLabel(p.status)}
                      </span>
                    </td>
                    <td>
                      {p.cashReceiptUrl ? (
                        <a
                          className="btn ghost sm"
                          href={p.cashReceiptUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          PDF
                        </a>
                      ) : (
                        <span className="pa-dash">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
