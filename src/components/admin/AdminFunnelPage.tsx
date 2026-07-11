"use client";

import { useEffect, useState } from "react";

type FunnelStep = {
  key: string;
  label: string;
  eventName: string | null;
  total: number;
  uniqueUsers: number;
};

type FunnelSnapshot = {
  days: number;
  since: string;
  steps: FunnelStep[];
  activeMatchesNow: number;
  rates: {
    consultationFromCta: number | null;
    signupFromConsultation: number | null;
    activeFromSignup: number | null;
  };
};

const DAY_OPTIONS = [7, 30, 90] as const;

function formatRate(value: number | null): string {
  if (value === null) return "—";
  return `${value}%`;
}

export function AdminFunnelPage() {
  const [days, setDays] = useState<number>(30);
  const [funnel, setFunnel] = useState<FunnelSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/funnel?days=${days}`)
      .then(async (r) => {
        if (!r.ok) {
          const data = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `요청 실패 (${r.status})`);
        }
        return r.json() as Promise<{ funnel: FunnelSnapshot }>;
      })
      .then((data) => setFunnel(data.funnel))
      .catch(() => setError("퍼널 데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [days]);

  const maxTotal = funnel ? Math.max(...funnel.steps.map((s) => s.total), 1) : 1;

  return (
    <section className="page on" data-screen-label="퍼널">
      <div className="crumb">/admin/funnel</div>
      <h1>전환 퍼널</h1>
      <p className="sub">상담 CTA → 상담 신청 → 가입 → 수업 시작(ACTIVE) 단계별 이벤트 집계</p>

      <div className="sec filters">
        <div className="opts">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              className="opt"
              aria-pressed={days === d}
              onClick={() => setDays(d)}
            >
              최근 {d}일
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="sec banner err">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          <span>{error}</span>
        </div>
      ) : null}

      {loading || !funnel ? (
        <p className="sub">불러오는 중…</p>
      ) : (
        <>
          <div className="sec grid3" style={{ marginTop: 0 }}>
            <div className="card kpi">
              <b>{formatRate(funnel.rates.consultationFromCta)}</b>
              <span>상담 신청 / CTA</span>
            </div>
            <div className="card kpi">
              <b>{formatRate(funnel.rates.signupFromConsultation)}</b>
              <span>가입 / 상담 신청</span>
            </div>
            <div className="card kpi">
              <b>{formatRate(funnel.rates.activeFromSignup)}</b>
              <span>ACTIVE / 가입</span>
            </div>
          </div>

          <div className="sec card funnel">
            {funnel.steps.map((step, index) => (
              <div key={step.key} className="f">
                <b>{index + 1}. {step.label}</b>
                <span className="tr">
                  <i style={{ "--w": `${Math.max(4, (step.total / maxTotal) * 100)}%` } as React.CSSProperties}></i>
                </span>
                <span className="n">
                  <b>{step.total.toLocaleString()}</b> · 고유 {step.uniqueUsers.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="sec banner ok">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 14 4-4 4 3 5-6" /></svg>
            <span>
              집계 시작 {new Date(funnel.since).toLocaleDateString("ko-KR")} · 현재 활성 매칭(수업 중 스냅샷){" "}
              {funnel.activeMatchesNow.toLocaleString()}건
            </span>
          </div>
        </>
      )}
    </section>
  );
}
