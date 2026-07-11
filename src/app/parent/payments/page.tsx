import { listParentChildren, listParentPayments } from "@/lib/parent-data";
import { requireParentPage } from "@/lib/parent-page-auth";
import { formatSubscriptionPlanLabel } from "@/lib/subscription-label";

export const dynamic = "force-dynamic";

function formatAmount(amount: number | null): string {
  return `${(amount ?? 0).toLocaleString("ko-KR")}원`;
}

function formatDate(d: Date | null): string {
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

  const activeChild = children.find((c) => c.subscription) ?? null;
  const otherChildren = children.filter((c) => c !== activeChild);

  return (
    <section className="page on" id="pg-pay" data-screen-label="학부모 결제">
      <div className="crumb">/parent/payments</div>
      <h1>결제</h1>
      <p className="sub">자녀별 플랜·자동갱신·청구 이력. 결제는 학생·학부모 모두 가능합니다.</p>

      <div className="sec grid2">
        <div
          className="card"
          style={{
            padding: "20px",
            background: "linear-gradient(150deg,var(--acc),var(--acc-press))",
            color: "var(--on-acc)",
            border: 0,
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            {activeChild ? `${activeChild.name} · 현재 플랜` : "현재 플랜"}
          </p>
          <b style={{ fontSize: "22px", fontWeight: 800, display: "block", marginTop: "6px" }}>
            {activeChild
              ? formatSubscriptionPlanLabel(activeChild.subscription!.plan)
              : "진행 중인 플랜 없음"}
          </b>
          <p style={{ fontSize: "13px", opacity: 0.92, marginTop: "3px" }}>
            {activeChild?.subjects || "상담 완료 후 플랜이 시작됩니다"}
          </p>
          <div
            style={{
              marginTop: "14px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(255,255,255,.25)",
              display: "flex",
              fontSize: "13px",
            }}
          >
            <span style={{ opacity: 0.85 }}>다음 결제일</span>
            <b style={{ marginLeft: "auto" }}>
              {activeChild?.subscription?.periodEnd
                ? formatDate(activeChild.subscription.periodEnd)
                : "-"}
            </b>
          </div>
        </div>

        <div
          className="card"
          style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: "14px", fontWeight: 700 }}>자동 갱신</b>
              <p style={{ fontSize: "12.5px", color: "var(--mut)" }}>
                {activeChild ? "매월 정기 결제" : "플랜 결제 후 이용 가능"}
              </p>
            </div>
            <button
              className={activeChild ? "switch on" : "switch"}
              aria-label="자동 갱신"
              disabled
            >
              <i></i>
            </button>
          </div>
          {otherChildren.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: "14px", fontWeight: 700 }}>{c.name} 플랜</b>
                <p style={{ fontSize: "12.5px", color: "var(--mut)" }}>매칭 완료 후 결제 가능</p>
              </div>
              <button className="btn pri sm">플랜 보기</button>
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <h2>청구 이력</h2>
        <div className="card">
          {rows.length === 0 ? (
            <div className="row">
              <div className="g">
                <b>청구 이력이 없습니다</b>
                <p>결제가 완료되면 여기에 영수증과 함께 표시됩니다.</p>
              </div>
            </div>
          ) : (
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
                    <td>{statusLabel(p.status)}</td>
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
                        <span style={{ color: "var(--mut-2)", fontSize: "12.5px" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
