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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-text-primary">정산</h2>

        {/* Month picker */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-text-primary shadow-sm transition hover:bg-gray-50"
            aria-label="이전 달"
          >
            ‹
          </button>
          <span className="min-w-[8rem] text-center text-sm font-semibold text-text-primary">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-text-primary shadow-sm transition hover:bg-gray-50"
            aria-label="다음 달"
          >
            ›
          </button>
        </div>
      </div>

      {/* Info note */}
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        지급은 PG 지급대행 연동 전까지 수동 이체로 처리합니다. 시급 기준: 30,000원.
      </p>

      {loading && (
        <div className="py-12 text-center text-text-muted">불러오는 중…</div>
      )}

      {!loading && error && (
        <div className="py-12 text-center text-accent">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs text-text-muted">완료 수업 수</p>
              <p className="mt-2 text-3xl font-black text-text-primary">
                {data.totals.lessonCount}
              </p>
              <p className="mt-1 text-xs text-text-muted">건</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs text-text-muted">총 수업 시간</p>
              <p className="mt-2 text-3xl font-black text-text-primary">
                {data.totals.totalHours}
              </p>
              <p className="mt-1 text-xs text-text-muted">시간</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs text-text-muted">총 정산액</p>
              <p className="mt-2 text-3xl font-black text-text-primary">
                {fmtKrw(data.totals.payoutKrw)}
              </p>
              {data.needsReview > 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  검토 필요 {data.needsReview}건 포함
                </p>
              )}
            </div>
          </div>

          {/* Teacher table */}
          <section>
            <h3 className="mb-4 text-lg font-bold text-text-primary">선생님별 정산 내역</h3>
            {data.teachers.length === 0 ? (
              <p className="text-sm text-text-muted">
                {monthLabel} 완료된 수업이 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-text-muted">
                    <tr>
                      <th className="px-4 py-3">선생님</th>
                      <th className="px-4 py-3 text-right">완료 수업 수</th>
                      <th className="px-4 py-3 text-right">총 시간</th>
                      <th className="px-4 py-3 text-right">정산액</th>
                      <th className="px-4 py-3 text-right">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.teachers.map((t) => (
                      <tr key={t.teacherId} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium text-text-primary">{t.name}</p>
                          <p className="text-xs text-text-muted">{t.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-text-secondary">
                          {t.lessonCount}건
                        </td>
                        <td className="px-4 py-3 text-right text-text-secondary">
                          {t.totalHours}시간
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-text-primary">
                          {fmtKrw(t.payoutKrw)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {t.needsReview > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              검토 필요 {t.needsReview}건
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Totals row */}
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                      <td className="px-4 py-3 text-text-primary">합계</td>
                      <td className="px-4 py-3 text-right text-text-primary">
                        {data.totals.lessonCount}건
                      </td>
                      <td className="px-4 py-3 text-right text-text-primary">
                        {data.totals.totalHours}시간
                      </td>
                      <td className="px-4 py-3 text-right text-text-primary">
                        {fmtKrw(data.totals.payoutKrw)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {data.needsReview > 0 ? (
                          <span className="text-xs text-amber-600">
                            검토 {data.needsReview}건
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
