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

/** 자녀 선택 + 선택 자녀의 월간 리포트 테이블. */
export function ReportsView({ items }: { items: ReportChild[] }) {
  const [selected, setSelected] = useState(items[0]?.id ?? "");
  const [open, setOpen] = useState<string | null>(null);

  const child = items.find((c) => c.id === selected) ?? items[0];
  const reports = child?.reports ?? [];

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
                  <td>{open === r.month ? r.detail || commentText(r) : commentText(r)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn sec sm"
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
    </div>
  );
}
