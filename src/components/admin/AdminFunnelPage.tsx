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
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-text-primary">전환 퍼널</h2>
          <p className="mt-1 text-sm text-text-secondary">
            상담 CTA → 상담 신청 → 가입 → 수업 시작(ACTIVE) 단계별 이벤트 집계
          </p>
        </div>
        <div className="flex gap-2">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                days === d
                  ? "bg-primary text-white"
                  : "border border-gray-200 bg-white text-text-secondary hover:border-primary/30"
              }`}
            >
              최근 {d}일
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-sm text-accent">
          {error}
        </div>
      ) : null}

      {loading || !funnel ? (
        <p className="mt-6 text-sm text-text-secondary">불러오는 중…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-text-secondary">상담 신청 / CTA</p>
              <p className="mt-2 text-2xl font-black text-text-primary">
                {formatRate(funnel.rates.consultationFromCta)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-text-secondary">가입 / 상담 신청</p>
              <p className="mt-2 text-2xl font-black text-text-primary">
                {formatRate(funnel.rates.signupFromConsultation)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-text-secondary">ACTIVE / 가입</p>
              <p className="mt-2 text-2xl font-black text-text-primary">
                {formatRate(funnel.rates.activeFromSignup)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold text-text-secondary">
              집계 시작: {new Date(funnel.since).toLocaleDateString("ko-KR")}
            </p>
            <div className="mt-5 space-y-5">
              {funnel.steps.map((step, index) => (
                <div key={step.key}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-text-primary">
                        {index + 1}. {step.label}
                      </p>
                      {step.eventName ? (
                        <p className="text-xs text-text-secondary">{step.eventName}</p>
                      ) : null}
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-black text-text-primary">{step.total.toLocaleString()}건</p>
                      <p className="text-xs text-text-secondary">
                        고유 사용자 {step.uniqueUsers.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(4, (step.total / maxTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-4 text-sm text-text-secondary">
            현재 활성 매칭(수업 중 스냅샷):{" "}
            <span className="font-black text-text-primary">
              {funnel.activeMatchesNow.toLocaleString()}건
            </span>
          </div>
        </>
      )}
    </div>
  );
}
