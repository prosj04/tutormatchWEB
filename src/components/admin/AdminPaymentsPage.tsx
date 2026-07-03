"use client";

import { useCallback, useEffect, useState } from "react";

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
  if (status === "FAILED") return "bg-pink-100 text-accent";
  if (status === "PROCESSING") return "bg-amber-100 text-amber-900";
  if (status === "REFUNDED") return "bg-orange-100 text-orange-800";
  return "bg-emerald-100 text-emerald-800";
}

function statusLabel(status: string) {
  if (status === "REFUNDED") return "환불 이력";
  return status;
}

export function AdminPaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundPending, setRefundPending] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/payments?${params.toString()}`);
    if (res.ok) {
      const data = (await res.json()) as { payments: PaymentRow[] };
      setRows(data.payments);
    }
    setLoading(false);
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

  return (
    <div>
      <h2 className="text-2xl font-black text-text-primary">결제 기록</h2>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium ${
              status === f.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 text-text-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">주문번호</th>
              <th className="px-4 py-3">학생</th>
              <th className="px-4 py-3">플랜</th>
              <th className="px-4 py-3">금액</th>
              <th className="px-4 py-3">생성일</th>
              <th className="px-4 py-3">수정일</th>
              <th className="px-4 py-3">액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                  불러오는 중…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                  결과 없음
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 align-top">
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{row.orderId}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary">{row.studentName ?? "—"}</div>
                    <div className="text-xs text-text-muted">{row.studentPhone ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{row.planId}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {row.amount != null ? `${row.amount.toLocaleString()}원` : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(row.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(row.updatedAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    {row.status === "COMPLETED" && (
                      <button
                        type="button"
                        onClick={() => openRefundDialog(row.id)}
                        className="rounded-lg border border-orange-200 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50"
                      >
                        환불 처리
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {refundingId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-text-primary">환불 처리</h3>
            <p className="mt-2 text-sm text-text-secondary">
              해당 결제를 환불 처리합니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-4">
              <label className="block text-xs font-medium text-text-muted">환불 사유 (선택)</label>
              <input
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="환불 사유를 입력하세요"
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={closeRefundDialog}
                className="flex-1 rounded-xl border py-2 text-sm"
                disabled={refundPending}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void submitRefund()}
                className="flex-1 rounded-xl bg-orange-600 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={refundPending}
              >
                {refundPending ? "처리 중…" : "환불 확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
