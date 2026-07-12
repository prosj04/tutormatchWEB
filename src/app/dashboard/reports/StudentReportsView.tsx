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
      <div className="sec">
        <div className="card">
          <div className="row">
            <div className="g">
              <b>아직 월간 리포트가 없어요</b>
              <p>첫 달 수업이 끝나면 월간 리포트가 만들어져요.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sec">
      <div className="card">
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
              const delta =
                r.overallScore != null && r.prevScore != null
                  ? r.overallScore - r.prevScore
                  : null;
              return (
                <tr key={r.month}>
                  <td className="num">{formatReportMonth(r.month)}</td>
                  <td className="num">
                    {r.overallScore != null ? (
                      <>
                        {r.overallScore}
                        {delta != null && delta !== 0 ? (
                          <span style={{ color: "var(--acc-text)", fontSize: "12px" }}>
                            {" "}
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
                      className="btn sec sm"
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

      {openReport ? (
        <div className="sec" id="report-detail">
          <h2>
            {formatReportMonthLong(openReport.month)} 리포트 · {studentName}
          </h2>
          <div className="grid2">
            <div className="card" style={{ padding: "20px" }}>
              {openReport.overallScore != null ? (
                <>
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      color: "var(--mut-2)",
                    }}
                  >
                    점수 변화
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "10px",
                      marginTop: "8px",
                    }}
                  >
                    <b
                      style={{
                        fontSize: "36px",
                        fontWeight: 800,
                        letterSpacing: "-.02em",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {openReport.overallScore}
                    </b>
                    {openReport.prevScore != null &&
                    openReport.overallScore - openReport.prevScore !== 0 ? (
                      <span
                        style={{
                          color: "var(--acc-text)",
                          fontWeight: 700,
                          fontSize: "14px",
                        }}
                      >
                        {openReport.overallScore - openReport.prevScore > 0 ? "▲" : "▼"}
                        {Math.abs(openReport.overallScore - openReport.prevScore)} 지난달 대비
                      </span>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}

              {openReport.subjectScores.length > 0 ? (
                <div
                  style={{
                    marginTop: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {openReport.subjectScores.map((s) => (
                    <div
                      key={s.subject}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "56px 1fr 74px",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "13px",
                      }}
                    >
                      <b>{s.subject}</b>
                      <span
                        style={{
                          height: "8px",
                          borderRadius: "5px",
                          background: "var(--panel-2)",
                          overflow: "hidden",
                          display: "block",
                        }}
                      >
                        <i
                          style={{
                            display: "block",
                            height: "100%",
                            width: `${s.curr}%`,
                            background: "var(--acc)",
                            borderRadius: "5px",
                          }}
                        />
                      </span>
                      <span
                        className="num"
                        style={{ textAlign: "right", color: "var(--mut)" }}
                      >
                        {s.prev != null ? `${s.prev}→${s.curr}` : `${s.curr}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {openReport.weakTypes.length > 0 ? (
                <>
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
                    {openReport.weakTypes.map((type) => (
                      <span key={type} className="opt" style={{ cursor: "default" }}>
                        {type}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
            <div className="card">
              {openReport.teacherComment ? (
                <div className="row">
                  <span className="av">선</span>
                  <div className="g">
                    <b>선생님 코멘트</b>
                    <p>{openReport.teacherComment}</p>
                  </div>
                </div>
              ) : null}
              {openReport.managerComment ? (
                <div className="row">
                  <span className="av">매</span>
                  <div className="g">
                    <b>매니저 코멘트</b>
                    <p>{openReport.managerComment}</p>
                  </div>
                </div>
              ) : null}
              {!openReport.teacherComment &&
              !openReport.managerComment &&
              (openReport.detail || openReport.summary) ? (
                <div className="row">
                  <div className="g">
                    <b>선생님·매니저 코멘트</b>
                    <p>{openReport.detail || openReport.summary}</p>
                  </div>
                </div>
              ) : null}
              {!openReport.teacherComment &&
              !openReport.managerComment &&
              !openReport.detail &&
              !openReport.summary ? (
                <div className="row">
                  <div className="g">
                    <b>선생님·매니저 코멘트</b>
                    <p>코멘트가 아직 없습니다.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
