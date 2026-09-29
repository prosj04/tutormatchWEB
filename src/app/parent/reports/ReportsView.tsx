"use client";

import { useState } from "react";

export type SubjectScore = { subject: string; prev: number | null; curr: number };

export type ReportRow = {
  month: string;
  summary: string | null;
  weakTypes: string[];
  detail: string | null;
  overallScore: number | null;
  prevScore: number | null;
  subjectScores: SubjectScore[];
  teacherComment: string | null;
  managerComment: string | null;
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
  const cnt =
    (report.teacherComment ? 1 : 0) + (report.managerComment ? 1 : 0);
  if (cnt > 0) return `코멘트 ${cnt}건`;
  if (report.summary) return report.summary;
  if (report.weakTypes.length > 0) return `취약 유형 ${report.weakTypes.length}건`;
  return "코멘트 없음";
}

/** 과목 변화 요약: "수학 78→89 · 영어 71→78". prev 없으면 curr만. */
function subjectSummary(scores: SubjectScore[]): string {
  if (scores.length === 0) return "-";
  return scores
    .map((s) =>
      s.prev != null ? `${s.subject} ${s.prev}→${s.curr}` : `${s.subject} ${s.curr}`,
    )
    .join(" · ");
}

/** "2026-09" → "2026년 9월" */
function formatReportMonthLong(month: string): string {
  const [y, m] = month.split("-");
  if (!y || !m) return month;
  return `${y}년 ${Number(m)}월`;
}

function deltaOf(report: ReportRow): number | null {
  if (report.overallScore == null || report.prevScore == null) return null;
  const d = report.overallScore - report.prevScore;
  return d === 0 ? null : d;
}

/** 자녀 선택 + 선택 자녀의 월간 리포트 목록·열람 지면. */
export function ReportsView({ items }: { items: ReportChild[] }) {
  const [selected, setSelected] = useState(items[0]?.id ?? "");
  const [open, setOpen] = useState<string | null>(null);

  const child = items.find((c) => c.id === selected) ?? items[0];
  const reports = child?.reports ?? [];
  const openReport = reports.find((r) => r.month === open) ?? null;
  const openDelta = openReport ? deltaOf(openReport) : null;

  return (
    <div className="sec">
      {items.length > 1 && (
        <div className="opts pa-pick">
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

      {reports.length === 0 ? (
        <div className="pa-empty">
          <p>아직 등록된 리포트가 없습니다.</p>
          <p className="pa-note">선생님·매니저가 월간 리포트를 등록하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="pa-months">
          {reports.map((r) => {
            const delta = deltaOf(r);
            return (
              <div key={r.month}>
                <span className="m">{formatReportMonth(r.month)}</span>
                <span className="s">
                  {r.overallScore != null ? (
                    <>
                      {r.overallScore}
                      {delta != null ? (
                        <i>
                          {delta > 0 ? "▲" : "▼"}
                          {Math.abs(delta)}
                        </i>
                      ) : null}
                    </>
                  ) : (
                    "-"
                  )}
                </span>
                <span className="pa-x">
                  {subjectSummary(r.subjectScores)}
                  <i>{commentText(r)}</i>
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  data-month={r.month}
                  aria-pressed={open === r.month}
                  onClick={() => setOpen(open === r.month ? null : r.month)}
                >
                  {open === r.month ? "접기" : "열람"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {openReport ? (
        <article className="pa-report" id="report-detail">
          <h2>
            {formatReportMonthLong(openReport.month)} 리포트 · {child?.name}
          </h2>

          {openReport.overallScore != null ? (
            <div className="pa-figs">
              <div className="pa-fig">
                <span className="pa-label">점수 변화</span>
                <b>
                  {openReport.overallScore}
                  {openDelta != null ? (
                    <i>
                      {openDelta > 0 ? "▲" : "▼"}
                      {Math.abs(openDelta)} 지난달 대비
                    </i>
                  ) : null}
                </b>
              </div>
            </div>
          ) : (
            <div className="pa-figs">
              <div className="pa-fig">
                <span className="pa-label">종합 코멘트</span>
                <p className="pa-summary">
                  {openReport.summary || "요약 코멘트가 아직 없습니다."}
                </p>
              </div>
            </div>
          )}

          {openReport.subjectScores.length > 0 ? (
            <div className="pa-subjects">
              {openReport.subjectScores.map((s) => (
                <div key={s.subject}>
                  <b>{s.subject}</b>
                  <span className="pa-bar">
                    <i style={{ width: `${s.curr}%` }} />
                  </span>
                  <span className="n">
                    {s.prev != null ? `${s.prev}→${s.curr}` : `${s.curr}`}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {openReport.weakTypes.length > 0 ? (
            <div className="pa-weak">
              <span className="pa-label">취약 유형</span>
              <div className="tag-line">
                {openReport.weakTypes.map((type) => (
                  <span key={type}>{type}</span>
                ))}
              </div>
            </div>
          ) : null}

          {openReport.teacherComment ? (
            <div className="pa-quote">
              <span className="pa-label">선생님 코멘트</span>
              <p>{openReport.teacherComment}</p>
            </div>
          ) : null}
          {openReport.managerComment ? (
            <div className="pa-quote">
              <span className="pa-label">매니저 코멘트</span>
              <p>{openReport.managerComment}</p>
            </div>
          ) : null}
          {!openReport.teacherComment &&
          !openReport.managerComment &&
          (openReport.detail || openReport.summary) ? (
            <div className="pa-quote">
              <span className="pa-label">선생님·매니저 코멘트</span>
              <p>{openReport.detail || openReport.summary}</p>
            </div>
          ) : null}
          {!openReport.teacherComment &&
          !openReport.managerComment &&
          !openReport.detail &&
          !openReport.summary ? (
            <div className="pa-quote">
              <span className="pa-label">선생님·매니저 코멘트</span>
              <p>코멘트가 아직 없습니다.</p>
            </div>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
