"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SettlementLesson = {
  id: string;
  date: string;
  subject: string;
  studentName: string;
  durationMin: number;
};

type SettlementResponse = {
  year: number;
  month: number;
  hourlyRateKrw: number;
  lessonCount: number;
  totalMinutes: number;
  totalHours: number;
  payoutKrw: number;
  lessons: SettlementLesson[];
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** 최근 12개월 옵션 (KST 기준 현재 월 포함). */
function recentMonths(): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return out;
}

function formatKrw(krw: number) {
  return `${krw.toLocaleString("ko-KR")}원`;
}

function formatLessonDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TeacherSettlementsClient() {
  const months = useMemo(() => recentMonths(), []);
  const [month, setMonth] = useState(months[0]);
  const [data, setData] = useState<SettlementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/teacher/settlements?month=${month}`);
      if (!res.ok) {
        setError(true);
        return;
      }
      setData((await res.json()) as SettlementResponse);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="page on" id="pg-settlements">
      <div className="crumb">/teacher-portal/dashboard/settlements</div>
      <h1>정산</h1>
      <p className="sub">
        완료된 수업 기준 월별 정산 내역입니다. 시급 {data ? formatKrw(data.hourlyRateKrw) : "30,000원"} ×
        수업 시간으로 계산되며, 조회 전용입니다.
      </p>

      <div className="sec" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <label htmlFor="settlement-month" style={{ fontSize: "13px", fontWeight: 600 }}>
          정산 월
        </label>
        <select
          id="settlement-month"
          className="inp filled"
          style={{ width: "auto", padding: "8px 10px" }}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m.replace("-", "년 ")}월
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="sec card" style={{ padding: "18px 20px" }}>
          <p>불러오는 중…</p>
        </div>
      ) : error ? (
        <div className="sec banner warn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          <span>정산 내역을 불러오지 못했습니다.</span>
        </div>
      ) : !data ? null : (
        <>
          <div className="sec grid3">
            <div className="card kpi">
              <b>{data.lessonCount}</b>
              <span>완료 수업</span>
            </div>
            <div className="card kpi">
              <b>{data.totalHours}<em>시간</em></b>
              <span>총 수업 시간</span>
            </div>
            <div className="card kpi">
              <b>{formatKrw(data.payoutKrw)}</b>
              <span>정산 합계</span>
            </div>
          </div>

          <div className="sec">
            <h2>완료 수업 내역</h2>
            {data.lessons.length === 0 ? (
              <div className="card" style={{ padding: "18px 20px" }}>
                <p>이 달에 완료된 수업이 없습니다.</p>
              </div>
            ) : (
              <div className="card">
                {data.lessons.map((lesson) => (
                  <div className="row" key={lesson.id}>
                    <div className="g">
                      <b>{formatLessonDate(lesson.date)}</b>
                      <p>
                        {lesson.studentName} · {lesson.subject}
                      </p>
                    </div>
                    <span className="r num" style={{ fontWeight: 800, color: "var(--fg)" }}>
                      {lesson.durationMin}분
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
