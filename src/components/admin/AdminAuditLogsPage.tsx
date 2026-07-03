"use client";

import { useCallback, useEffect, useState } from "react";

type AuditLogRow = {
  id: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string | null;
  createdAt: string;
};

type ApiResponse = {
  logs: AuditLogRow[];
  total: number;
  page: number;
  take: number;
  totalPages: number;
};

const TARGET_TYPE_FILTERS = [
  { value: "", label: "전체" },
  { value: "Student", label: "학생" },
  { value: "User", label: "사용자" },
  { value: "Teacher", label: "선생님" },
  { value: "PaymentCompletion", label: "결제" },
  { value: "Subscription", label: "구독" },
];

export function AdminAuditLogsPage() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [targetType, setTargetType] = useState("");
  const take = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), take: String(take) });
    if (targetType) params.set("targetType", targetType);
    try {
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as ApiResponse;
        setRows(data.logs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, targetType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleFilterChange(value: string) {
    setTargetType(value);
    setPage(1);
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-text-primary">감사 로그</h2>
      <p className="mt-1 text-sm text-text-muted">BR-15: 개인정보 접근·변경 기록 (1년 보관)</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TARGET_TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => handleFilterChange(f.value)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium ${
              targetType === f.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 text-text-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 text-xs text-text-muted">총 {total.toLocaleString()}건</div>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">시각</th>
              <th className="px-4 py-3">액션</th>
              <th className="px-4 py-3">행위자 ID</th>
              <th className="px-4 py-3">역할</th>
              <th className="px-4 py-3">대상 유형</th>
              <th className="px-4 py-3">대상 ID</th>
              <th className="px-4 py-3">상세</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  불러오는 중…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  결과 없음
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 align-top">
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {new Date(row.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
                      {row.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {row.actorUserId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{row.actorRole}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{row.targetType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {row.targetId.slice(0, 8)}…
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-xs text-text-muted">
                    {row.detail ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-text-secondary disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm text-text-muted">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-text-secondary disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
