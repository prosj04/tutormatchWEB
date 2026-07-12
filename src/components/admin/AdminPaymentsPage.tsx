"use client";

import { useCallback, useEffect, useState } from "react";

import { formatDateKst } from "@/lib/format-date";

type PaymentRow = {
  id: string;
  orderId: string;
  paymentKey: string | null;
  status: string;
  amount: number | null;
  planId: string;
  studentName: string | null;
  studentPhone: string | null;
  createdAt: string;
  updatedAt: string;
};

const FILTERS = [
  { value: "", label: "실패/진행중" },
  { value: "FAILED", label: "실패" },
  { value: "PROCESSING", label: "진행중" },
  { value: "COMPLETED", label: "완료" },
  { value: "REFUNDED", label: "환불" },
  { value: "ALL", label: "전체" },
];

function statusBadgeClass(status: string) {
  if (status === "COMPLETED") return "acc";
  if (status === "PROCESSING" || status === "REFUNDED") return "warn";
  return "mut";
}

function statusLabel(status: string) {
  if (status === "REFUNDED") return "환불 이력";
  return status;
}

export function AdminPaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundPending, setRefundPending] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { payments: PaymentRow[] };
      setRows(data.payments);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function openRefundDialog(id: string) {
    setRefundingId(id);
    setRefundReason("");
  }

  function closeRefundDialog() {
    setRefundingId(null);
    setRefundReason("");
  }

  async function submitRefund() {
    if (!refundingId) return;
    setRefundPending(true);
    try {
      const res = await fetch(`/api/admin/payments/${refundingId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason || undefined }),
      });
      if (res.ok) {
        closeRefundDialog();
        await fetchList();
      } else {
        const err = (await res.json()) as { error?: string };
        alert(err.error ?? "환불 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setRefundPending(false);
    }
  }

  const refundingRow = rows.find((r) => r.id === refundingId) ?? null;

  return (
    <section className="page on" data-screen-label="결제 관리">
      <div className="crumb">/admin/payments</div>
      <h1>결제 관리</h1>
      <p className="sub">결제 이력과 환불 처리를 관리합니다.</p>

      <div className="sec filters">
        <div className="opts">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className="opt"
              aria-pressed={status === f.value}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="sec card" style={{ marginTop: 0, borderColor: "var(--danger, #d33)" }}>
          <div className="row">
            <div className="g">
              <b>불러오지 못했습니다</b>
              <p>결제 목록을 불러오는 중 문제가 발생했습니다.</p>
            </div>
            <button type="button" className="btn sec sm" onClick={() => fetchList()}>다시 시도</button>
          </div>
        </div>
      )}

      <div className="sec card" style={{ overflowX: "auto", marginTop: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>상태</th>
              <th>주문</th>
              <th>학생</th>
              <th>플랜</th>
              <th>금액</th>
              <th>생성일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>불러오는 중…</td></tr>
            ) : loadError ? (
              <tr><td colSpan={7}>—</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7}>결과 없음</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td><span className={`bst ${statusBadgeClass(row.status)}`}>{statusLabel(row.status)}</span></td>
                  <td>
                    <b>{row.planId}</b>
                    <span className="mini">{row.orderId}</span>
                  </td>
                  <td>
                    {row.studentName ?? "—"}
                    {row.studentPhone ? <span className="mini">{row.studentPhone}</span> : null}
                  </td>
                  <td>{row.planId}</td>
                  <td className="num">{row.amount != null ? `${row.amount.toLocaleString()}원` : "—"}</td>
                  <td>{formatDateKst(row.createdAt)}</td>
                  <td>
                    {row.status === "COMPLETED" && (
                      <button type="button" className="btn ghost sm" onClick={() => openRefundDialog(row.id)}>환불</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={`scrim${refundingId ? " on" : ""}`}>
        <div className="modal" role="dialog" aria-modal="true" aria-label="환불 처리">
          <div className="m-b">
            <h3>환불 처리</h3>
            <p className="m-p">
              {refundingRow
                ? `${refundingRow.orderId} · ${refundingRow.studentName ?? "학생"}${refundingRow.amount != null ? ` · ${refundingRow.amount.toLocaleString()}원` : ""}`
                : "해당 결제를 환불 처리합니다. 이 작업은 되돌릴 수 없습니다."}
            </p>
            <p className="m-p" style={{ marginTop: "8px", color: "var(--danger, #d33)", fontWeight: 600 }}>
              카드 결제는 Toss에서 전액 취소됩니다. 부분 환불은 지원하지 않습니다.
            </p>
            <div className="field" style={{ marginTop: "14px" }}>
              <label>환불 사유 (선택)</label>
              <input
                className="inp filled"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="환불 사유를 입력하세요"
              />
            </div>
          </div>
          <div className="m-f">
            <button type="button" className="btn sec" onClick={closeRefundDialog} disabled={refundPending}>취소</button>
            <button type="button" className="btn pri" onClick={() => void submitRefund()} disabled={refundPending}>
              {refundPending ? "처리 중…" : "환불 확정"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
