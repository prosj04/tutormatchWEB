"use client";

import { useEffect, useState } from "react";

import type { MonthlySettlementResult } from "@/lib/settlement";

function fmtKrw(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

/** Derive default = previous KST month (mirrors server logic) */
function defaultYearMonth(): { year: number; month: number } {
  const nowKst = new Date(Date.now() + 9 * 3600 * 1000);
  let year = nowKst.getUTCFullYear();
  let month = nowKst.getUTCMonth(); // 0-based = previous month of current KST month
  if (month === 0) {
    year -= 1;
    month = 12;
  }
  return { year, month };
}

function prevMonth(year: number, month: number) {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function nextMonth(year: number, month: number) {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

export function AdminSettlementsPage() {
  const def = defaultYearMonth();
  const [year, setYear] = useState(def.year);
  const [month, setMonth] = useState(def.month);
  const [data, setData] = useState<MonthlySettlementResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/settlements?year=${year}&month=${month}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("정산 데이터를 불러오지 못했습니다.");
        return res.json() as Promise<MonthlySettlementResult>;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "알 수 없는 오류");
        setLoading(false);
      });
  }, [year, month]);

  function handlePrev() {
    const p = prevMonth(year, month);
    setYear(p.year);
    setMonth(p.month);
  }

  function handleNext() {
    const n = nextMonth(year, month);
    setYear(n.year);
    setMonth(n.month);
  }

  const monthLabel = `${year}년 ${month}월`;

  return (
    <section className="page on" data-screen-label="정산">
      <div className="crumb">/admin/settlements</div>
      <h1>정산</h1>
      <p className="sub">선생님별 {monthLabel} 정산 집계입니다.</p>

      <div className="sec filters">
        <button type="button" className="btn ghost sm" onClick={handlePrev} aria-label="이전 달">‹ 이전 달</button>
        <span className="opt" aria-pressed="true">{monthLabel}</span>
        <button type="button" className="btn ghost sm" onClick={handleNext} aria-label="다음 달">다음 달 ›</button>
      </div>

      <div className="sec banner warn" style={{ marginTop: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
        <span>지급은 PG 지급대행 연동 전까지 수동 이체로 처리합니다. 시급 기준: 30,000원.</span>
      </div>

      {loading ? (
        <p className="sub">불러오는 중…</p>
      ) : error ? (
        <div className="sec banner err">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          <span>{error}</span>
        </div>
      ) : data ? (
        <>
          <div className="sec grid3">
            <div className="card kpi">
              <b>{data.totals.lessonCount}</b>
              <span>완료 수업 수 (건)</span>
            </div>
            <div className="card kpi">
              <b>{data.totals.totalHours}</b>
              <span>총 수업 시간</span>
            </div>
            <div className="card kpi">
              <b>{fmtKrw(data.totals.payoutKrw)}</b>
              <span>총 정산액{data.needsReview > 0 ? ` · 검토 필요 ${data.needsReview}건 포함` : ""}</span>
            </div>
          </div>

          <div className="sec card" style={{ overflow: "hidden" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, padding: "18px 20px 4px" }}>선생님별 정산 내역</h2>
            {data.teachers.length === 0 ? (
              <div className="empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 6H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6" /></svg>
                <b>{monthLabel} 완료된 수업이 없습니다.</b>
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>선생님</th>
                    <th>완료 수업 수</th>
                    <th>총 시간</th>
                    <th>정산액</th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teachers.map((t) => (
                    <tr key={t.teacherId}>
                      <td>
                        <b>{t.name}</b>
                        <span className="mini">{t.phone}</span>
                      </td>
                      <td className="num">{t.lessonCount}건</td>
                      <td className="num">{t.totalHours}시간</td>
                      <td className="num">{fmtKrw(t.payoutKrw)}</td>
                      <td>
                        {t.needsReview > 0 ? (
                          <span className="bst warn">검토 필요 {t.needsReview}건</span>
                        ) : (
                          <span className="bst mut">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td><b>합계</b></td>
                    <td className="num">{data.totals.lessonCount}건</td>
                    <td className="num">{data.totals.totalHours}시간</td>
                    <td className="num">{fmtKrw(data.totals.payoutKrw)}</td>
                    <td>{data.needsReview > 0 ? <span className="bst warn">검토 {data.needsReview}건</span> : null}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
