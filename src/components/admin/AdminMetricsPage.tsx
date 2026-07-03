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

type MetricsData = {
  cohorts: CohortRow[];
  refundRate: RefundRate;
  leadTime: LeadTime;
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
      <div className="px-4 py-12 text-center text-text-muted">불러오는 중…</div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 py-12 text-center text-accent">
        {error ?? "데이터를 불러올 수 없습니다."}
      </div>
    );
  }

  const { cohorts, refundRate, leadTime } = data;

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-black text-text-primary">지표 / 메트릭스</h2>

      {/* ── 코호트 표 ── */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-text-primary">월별 코호트 — 재결제율</h3>
        {cohorts.length === 0 ? (
          <p className="text-sm text-text-muted">데이터 없음</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3">코호트 월</th>
                  <th className="px-4 py-3 text-right">인원</th>
                  <th className="px-4 py-3 text-right">재결제</th>
                  <th className="px-4 py-3 text-right">재결제율</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((row) => (
                  <tr key={row.month} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium text-text-primary">{row.month}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{row.cohortSize}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{row.repurchaseCount}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          row.repurchaseRate >= 0.5
                            ? "text-emerald-700"
                            : row.repurchaseRate >= 0.2
                              ? "text-amber-700"
                              : "text-text-secondary"
                        }`}
                      >
                        {pct(row.repurchaseRate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 환불율 ── */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-text-primary">환불율</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs text-text-muted">전체 환불율</p>
            <p className="mt-2 text-3xl font-black text-text-primary">
              {pct(refundRate.overall.rate)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              환불 {refundRate.overall.refundedCount}건 / 완료+환불{" "}
              {refundRate.overall.refundedCount + refundRate.overall.completedCount}건
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs text-text-muted">최근 90일 환불율</p>
            <p className="mt-2 text-3xl font-black text-text-primary">
              {pct(refundRate.last90Days.rate)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              환불 {refundRate.last90Days.refundedCount}건 / 완료+환불{" "}
              {refundRate.last90Days.refundedCount + refundRate.last90Days.completedCount}건
            </p>
          </div>
        </div>
      </section>

      {/* ── 첫 수업 리드타임 ── */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-text-primary">첫 수업 리드타임</h3>
        <p className="mb-3 text-xs text-text-muted">
          첫 결제 완료 시각 → 첫 수업 시작 시각까지의 일수 (수업 있는 학생 기준)
        </p>
        {leadTime.studentCount === 0 ? (
          <p className="text-sm text-text-muted">데이터 없음</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs text-text-muted">대상 학생</p>
              <p className="mt-2 text-3xl font-black text-text-primary">{leadTime.studentCount}</p>
              <p className="mt-1 text-xs text-text-muted">명</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs text-text-muted">평균 리드타임</p>
              <p className="mt-2 text-3xl font-black text-text-primary">
                {leadTime.avgDays !== null ? `${leadTime.avgDays}일` : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs text-text-muted">P90 리드타임</p>
              <p className="mt-2 text-3xl font-black text-text-primary">
                {leadTime.p90Days !== null ? `${leadTime.p90Days}일` : "—"}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
