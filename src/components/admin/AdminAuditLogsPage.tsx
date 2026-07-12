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
  const [actionFilter, setActionFilter] = useState("");
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

  // G-8adm: 액션 유형 필터 — 현재 페이지에 로드된 로그의 action 종류로 구성(클라이언트 필터).
  const actionOptions = Array.from(new Set(rows.map((row) => row.action))).sort();
  const visibleRows = actionFilter
    ? rows.filter((row) => row.action === actionFilter)
    : rows;

  return (
    <section className="page on" data-screen-label="감사 로그">
      <div className="crumb">/admin/audit-logs</div>
      <h1>감사 로그</h1>
      <p className="sub">BR-15: 개인정보 접근·변경 기록 (1년 보관) · 총 {total.toLocaleString()}건</p>

      <div className="sec filters">
        <div className="opts">
          {TARGET_TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className="opt"
              aria-pressed={targetType === f.value}
              onClick={() => handleFilterChange(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {actionOptions.length > 0 && (
          <select
            className="inp filled"
            style={{ width: "auto" }}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">모든 액션</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        )}
      </div>

      <div className="sec card" style={{ overflowX: "auto", marginTop: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>시각</th>
              <th>관리자</th>
              <th>액션</th>
              <th>대상 유형</th>
              <th>대상</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>불러오는 중…</td></tr>
            ) : visibleRows.length === 0 ? (
              <tr><td colSpan={6}>결과 없음</td></tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.createdAt).toLocaleString("ko-KR")}</td>
                  <td title={row.actorUserId}>
                    <b>{row.actorUserId.slice(0, 8)}…</b>
                    <span className="mini">{row.actorRole}</span>
                  </td>
                  <td><span className="bst acc">{row.action}</span></td>
                  <td>{row.targetType}</td>
                  <td title={row.targetId}>{row.targetId.slice(0, 8)}…</td>
                  <td>{row.detail ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="sec" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <button type="button" className="btn ghost sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</button>
          <span className="sub" style={{ margin: 0 }}>{page} / {totalPages}</span>
          <button type="button" className="btn ghost sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>다음</button>
        </div>
      )}
    </section>
  );
}
