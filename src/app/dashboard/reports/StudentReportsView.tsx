"use client";

import { useState } from "react";

export type SubjectScore = { subject: string; prev: number | null; curr: number };

export type StudentReportRow = {
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

/** "2026-09" → "2026. 9." */
function formatReportMonth(month: string): string {
  const [y, m] = month.split("-");
  if (!y || !m) return month;
  return `${y}. ${Number(m)}.`;
}

/** "2026-09" → "2026년 9월" */
function formatReportMonthLong(month: string): string {
  const [y, m] = month.split("-");
  if (!y || !m) return month;
  return `${y}년 ${Number(m)}월`;
}

function commentText(report: StudentReportRow): string {
  const cnt = (report.teacherComment ? 1 : 0) + (report.managerComment ? 1 : 0);
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

function deltaOf(report: StudentReportRow): number | null {
  if (report.overallScore == null || report.prevScore == null) return null;
  const d = report.overallScore - report.prevScore;
  return d === 0 ? null : d;
}

/** 학생 본인 월간 리포트 목록 + 상세 열람. 앱 리포트 화면과 정보 구성 일치. */
export function StudentReportsView({
  reports,
  studentName,
}: {
  reports: StudentReportRow[];
  studentName: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const openReport = reports.find((r) => r.month === open) ?? null;

  if (reports.length === 0) {
    return (
      <div className="st-none">
        <b>아직 월간 리포트가 없어요</b>
        <p>첫 달 수업이 끝나면 월간 리포트가 만들어져요.</p>
      </div>
    );
  }

  return (
    <>
      <div className="st-block">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>월</th>
                <th>종합</th>
                <th>과목 변화</th>
                <th>코멘트</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const delta = deltaOf(r);
                return (
                  <tr key={r.month}>
                    <td>
                      <span className="st-rmonth">{formatReportMonth(r.month)}</span>
                    </td>
                    <td>
                      {r.overallScore != null ? (
                        <>
                          <span className="st-rscore">{r.overallScore}</span>
                          {delta != null ? (
                            <span className="st-delta">
                              {delta > 0 ? "▲" : "▼"}
                              {Math.abs(delta)}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{subjectSummary(r.subjectScores)}</td>
                    <td>{commentText(r)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        data-month={r.month}
                        aria-pressed={open === r.month}
                        onClick={() => setOpen(open === r.month ? null : r.month)}
                      >
                        {open === r.month ? "접기" : "열람"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {openReport ? (
        <div className="st-block st-report" id="report-detail">
          <h2>
            {formatReportMonthLong(openReport.month)} 리포트 · {studentName}
          </h2>

          {openReport.overallScore != null ? (
            <div className="st-block bare">
              <span className="st-label">점수 변화</span>
              <p>
                <span className="st-score">{openReport.overallScore}</span>
                {deltaOf(openReport) != null ? (
                  <span className="st-delta">
                    {(deltaOf(openReport) as number) > 0 ? "▲" : "▼"}
                    {Math.abs(deltaOf(openReport) as number)} 지난달 대비
                  </span>
                ) : null}
              </p>
            </div>
          ) : (
            <div className="st-block bare">
              <span className="st-label">종합 코멘트</span>
              <div className="st-report-body" style={{ marginTop: "10px" }}>
                <p>{openReport.summary || "요약 코멘트가 아직 없습니다."}</p>
              </div>
            </div>
          )}

          {openReport.subjectScores.length > 0 ? (
            <div className="st-bars" style={{ marginTop: "22px" }}>
              {openReport.subjectScores.map((s) => (
                <div key={s.subject}>
                  <b>{s.subject}</b>
                  <span className="tr">
                    <i style={{ width: `${Math.max(0, Math.min(100, s.curr))}%` }} />
                  </span>
                  <span className="n">
                    {s.prev != null ? `${s.prev}→${s.curr}` : `${s.curr}`}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {openReport.weakTypes.length > 0 ? (
            <div className="st-block">
              <span className="st-label">취약 유형</span>
              <p className="st-tags">
                {openReport.weakTypes.map((type) => (
                  <span key={type}>{type}</span>
                ))}
              </p>
            </div>
          ) : null}

          <div className="st-cmt" style={{ marginTop: "26px" }}>
            {openReport.teacherComment ? (
              <div>
                <span className="st-label">선생님 코멘트</span>
                <p>{openReport.teacherComment}</p>
              </div>
            ) : null}
            {openReport.managerComment ? (
              <div>
                <span className="st-label">매니저 코멘트</span>
                <p>{openReport.managerComment}</p>
              </div>
            ) : null}
            {!openReport.teacherComment &&
            !openReport.managerComment ? (
              <div>
                <span className="st-label">선생님·매니저 코멘트</span>
                <p>
                  {openReport.detail ||
                    openReport.summary ||
                    "코멘트가 아직 없습니다."}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
