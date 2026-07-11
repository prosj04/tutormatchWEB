"use client";

import { useEffect, useState } from "react";

type CohortRow = {
  month: string;
  cohortSize: number;
  repurchaseCount: number;
  repurchaseRate: number;
};

type RefundRate = {
  overall: { refundedCount: number; completedCount: number; rate: number };
  last90Days: { refundedCount: number; completedCount: number; rate: number };
};

type LeadTime = {
  studentCount: number;
  avgDays: number | null;
  p90Days: number | null;
};

type ManagerMetric = {
  id: string;
  name: string;
  role: string;
  consultations: { total: number; open: number };
  conversion: { denominator: number; numerator: number; rate: number | null };
  matchAcceptance: {
    active: number;
    pending: number;
    cancelled: number;
    rate: number | null;
    medianAcceptHours: number | null;
  };
  careLog30d: number;
};

type MetricsData = {
  cohorts: CohortRow[];
  refundRate: RefundRate;
  leadTime: LeadTime;
  managers: ManagerMetric[];
};

function pct(rate: number) {
  return `${(rate * 100).toFixed(1)}%`;
}

export function AdminMetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/metrics")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load metrics");
        return res.json() as Promise<MetricsData>;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "알 수 없는 오류");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="page on" data-screen-label="지표">
        <div className="crumb">/admin/metrics</div>
        <h1>지표</h1>
        <p className="sub">불러오는 중…</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="page on" data-screen-label="지표">
        <div className="crumb">/admin/metrics</div>
        <h1>지표</h1>
        <div className="sec banner err">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          <span>{error ?? "데이터를 불러올 수 없습니다."}</span>
        </div>
      </section>
    );
  }

  const { cohorts, refundRate, leadTime, managers } = data;
  const maxCohort = Math.max(1, ...cohorts.map((c) => c.cohortSize));

  return (
    <section className="page on" data-screen-label="지표">
      <div className="crumb">/admin/metrics</div>
      <h1>지표</h1>
      <p className="sub">기간별 핵심 지표 추이입니다.</p>

      <div className="sec grid2" style={{ marginTop: 0 }}>
        <div className="card">
          <h2 style={{ fontSize: "15px", fontWeight: 700, padding: "18px 20px 0" }}>월별 코호트 — 재결제율</h2>
          {cohorts.length === 0 ? (
            <div className="empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m7 14 4-4 4 3 5-6" /></svg>
              <b>데이터 없음</b>
            </div>
          ) : (
            <div className="bars">
              {cohorts.map((row) => (
                <div key={row.month} className="b">
                  <i style={{ height: `${Math.max(8, (row.cohortSize / maxCohort) * 100)}%` }}></i>
                  <span>{row.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr><th>코호트 월</th><th>인원</th><th>재결제</th><th>재결제율</th></tr>
            </thead>
            <tbody>
              {cohorts.length === 0 ? (
                <tr><td colSpan={4}>데이터 없음</td></tr>
              ) : (
                cohorts.map((row) => (
                  <tr key={row.month}>
                    <td><b>{row.month}</b></td>
                    <td className="num">{row.cohortSize}</td>
                    <td className="num">{row.repurchaseCount}</td>
                    <td>
                      <span className={`bst ${row.repurchaseRate >= 0.2 ? "acc" : "mut"}`}>{pct(row.repurchaseRate)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sec grid3">
        <div className="card kpi">
          <b>{pct(refundRate.overall.rate)}</b>
          <span>
            전체 환불율 — 환불 {refundRate.overall.refundedCount}건 / 완료+환불{" "}
            {refundRate.overall.refundedCount + refundRate.overall.completedCount}건
          </span>
        </div>
        <div className="card kpi">
          <b>{pct(refundRate.last90Days.rate)}</b>
          <span>
            최근 90일 환불율 — 환불 {refundRate.last90Days.refundedCount}건 / 완료+환불{" "}
            {refundRate.last90Days.refundedCount + refundRate.last90Days.completedCount}건
          </span>
        </div>
        <div className="card kpi">
          <b>{leadTime.avgDays !== null ? `${leadTime.avgDays}일` : "—"}</b>
          <span>
            첫 수업 평균 리드타임 — 대상 {leadTime.studentCount}명 · P90{" "}
            {leadTime.p90Days !== null ? `${leadTime.p90Days}일` : "—"}
          </span>
        </div>
      </div>

      <div className="sec card" style={{ overflow: "hidden" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, padding: "18px 20px 4px" }}>매니저별 성과</h2>
        {managers.length === 0 ? (
          <div className="empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
            <b>매니저 데이터 없음</b>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>매니저</th>
                <th>배정 상담<br />(진행중/전체)</th>
                <th>상담→결제 전환율</th>
                <th>매칭 수락률</th>
                <th>수락 소요<br />(중앙값)</th>
                <th>케어 로그<br />(30일)</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((mgr) => (
                <tr key={mgr.id}>
                  <td>
                    <b>{mgr.name}</b>
                    <span className="mini">{mgr.role === "CHIEF_MANAGER" ? "수석 매니저" : "매니저"}</span>
                  </td>
                  <td className="num">{mgr.consultations.open} / {mgr.consultations.total}</td>
                  <td>
                    {mgr.conversion.rate !== null ? (
                      <span className={`bst ${mgr.conversion.rate >= 0.2 ? "acc" : "mut"}`}>{pct(mgr.conversion.rate)}</span>
                    ) : (
                      <span className="bst mut">—</span>
                    )}
                    <span className="mini">{mgr.conversion.numerator}/{mgr.conversion.denominator}명</span>
                  </td>
                  <td>
                    {mgr.matchAcceptance.rate !== null ? (
                      <span className={`bst ${mgr.matchAcceptance.rate >= 0.4 ? "acc" : "mut"}`}>{pct(mgr.matchAcceptance.rate)}</span>
                    ) : (
                      <span className="bst mut">—</span>
                    )}
                    <span className="mini">
                      수락{mgr.matchAcceptance.active} 대기{mgr.matchAcceptance.pending} 취소{mgr.matchAcceptance.cancelled}
                    </span>
                  </td>
                  <td className="num">
                    {mgr.matchAcceptance.medianAcceptHours !== null
                      ? `${mgr.matchAcceptance.medianAcceptHours}시간`
                      : "—"}
                  </td>
                  <td className="num">{mgr.careLog30d}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
