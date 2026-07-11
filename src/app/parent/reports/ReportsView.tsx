"use client";

import { useState } from "react";

export type ReportRow = {
  month: string;
  summary: string | null;
  weakTypes: string[];
  detail: string | null;
};

export type ReportChild = {
  id: string;
  name: string;
  grade: string | null;
  reports: ReportRow[];
};

/** "2026-09" → "2026. 9." */
function formatReportMonth(month: string): string {
  const [y, m] = month.split("-");
  if (!y || !m) return month;
  return `${y}. ${Number(m)}.`;
}

function commentText(report: ReportRow): string {
  if (report.summary) return report.summary;
  if (report.weakTypes.length > 0) return `취약 유형 ${report.weakTypes.length}건`;
  return "코멘트 없음";
}

/** "2026-09" → "2026년 9월" */
function formatReportMonthLong(month: string): string {
  const [y, m] = month.split("-");
  if (!y || !m) return month;
  return `${y}년 ${Number(m)}월`;
}

/** 자녀 선택 + 선택 자녀의 월간 리포트 테이블. */
export function ReportsView({ items }: { items: ReportChild[] }) {
  const [selected, setSelected] = useState(items[0]?.id ?? "");
  const [open, setOpen] = useState<string | null>(null);

  const child = items.find((c) => c.id === selected) ?? items[0];
  const reports = child?.reports ?? [];
  const openReport = reports.find((r) => r.month === open) ?? null;

  return (
    <div className="sec">
      {items.length > 1 && (
        <div className="opts" style={{ marginBottom: "16px" }}>
          {items.map((c) => (
            <button
              key={c.id}
              type="button"
              className="opt"
              aria-pressed={c.id === selected}
              onClick={() => {
                setSelected(c.id);
                setOpen(null);
              }}
            >
              {c.name}
              {c.grade ? ` · ${c.grade}` : ""}
            </button>
          ))}
        </div>
      )}

      <div className="card">
        {reports.length === 0 ? (
          <div className="row">
            <div className="g">
              <b>아직 등록된 리포트가 없습니다</b>
              <p>선생님·매니저가 월간 리포트를 등록하면 여기에 표시됩니다.</p>
            </div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>월</th>
                <th>취약 유형</th>
                <th>코멘트</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.month}>
                  <td className="num">{formatReportMonth(r.month)}</td>
                  <td>{r.weakTypes.length > 0 ? r.weakTypes.join(" · ") : "-"}</td>
                  <td>{commentText(r)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn sec sm"
                      data-month={r.month}
                      aria-pressed={open === r.month}
                      onClick={() => setOpen(open === r.month ? null : r.month)}
                    >
                      {open === r.month ? "접기" : "열람"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openReport ? (
        <div className="sec" id="report-detail">
          <h2>
            {formatReportMonthLong(openReport.month)} 리포트 · {child?.name}
          </h2>
          <div className="grid2">
            <div className="card" style={{ padding: "20px" }}>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "var(--mut-2)",
                }}
              >
                종합 코멘트
              </p>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "13px",
                  color: "var(--fg)",
                  lineHeight: 1.55,
                }}
              >
                {openReport.summary || "요약 코멘트가 아직 없습니다."}
              </div>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "var(--mut-2)",
                  marginTop: "18px",
                }}
              >
                취약 유형
              </p>
              <div className="opts" style={{ marginTop: "10px" }}>
                {openReport.weakTypes.length > 0 ? (
                  openReport.weakTypes.map((type) => (
                    <span key={type} className="opt" style={{ cursor: "default" }}>
                      {type}
                    </span>
                  ))
                ) : (
                  <span className="opt" style={{ cursor: "default" }}>
                    기록된 취약 유형이 없습니다
                  </span>
                )}
              </div>
            </div>
            <div className="card">
              <div className="row">
                <div className="g">
                  <b>선생님·매니저 코멘트</b>
                  <p>{openReport.detail || openReport.summary || "코멘트가 아직 없습니다."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
