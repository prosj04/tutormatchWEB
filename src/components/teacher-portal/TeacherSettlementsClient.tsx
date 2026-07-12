"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SettlementLesson = {
  id: string;
  date: string;
  subject: string;
  studentName: string;
  durationMin: number;
  needsReview?: boolean;
};

type SettlementResponse = {
  year: number;
  month: number;
  hourlyRateKrw: number;
  lessonCount: number;
  totalMinutes: number;
  totalHours: number;
  payoutKrw: number;
  needsReview?: number;
  lessons: SettlementLesson[];
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * 서버가 알려준 기준월(year/month, KST)에서 역순으로 최근 12개월 옵션 생성.
 * E9-2: 브라우저 로컬 TZ가 아니라 서버 KST 기준월을 앵커로 사용해 해외 환경에서
 * 월이 어긋나지 않게 한다.
 */
function recentMonthsFrom(year: number, month: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    // month는 1-based. Date로 정규화해 월 롤오버 처리.
    const d = new Date(year, month - 1 - i, 1);
    out.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
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
  // month 미선택(빈 문자열)이면 서버가 KST 현재월로 응답 → 그 값으로 초기화.
  const [month, setMonth] = useState("");
  // E9-2: 첫 응답에서 확정된 서버 KST 현재월. 옵션 목록의 안정적 앵커.
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number } | null>(null);
  const [data, setData] = useState<SettlementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const query = month ? `?month=${month}` : "";
      const res = await fetch(`/api/teacher/settlements${query}`);
      if (!res.ok) {
        setError(true);
        return;
      }
      const json = (await res.json()) as SettlementResponse;
      setData(json);
      // 첫 로드(빈 month)일 때 서버가 알려준 KST 현재월을 앵커로 고정.
      if (!month) {
        setCurrentMonth({ year: json.year, month: json.month });
        setMonth(`${json.year}-${pad2(json.month)}`);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  // 옵션은 서버 KST 현재월(currentMonth) 앵커에서 최근 12개월.
  const months = useMemo(() => {
    if (!currentMonth) return [] as string[];
    return recentMonthsFrom(currentMonth.year, currentMonth.month);
  }, [currentMonth]);

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
          disabled={months.length === 0}
          onChange={(e) => setMonth(e.target.value)}
        >
          {months.length === 0 ? <option value="">—</option> : null}
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

          {data.needsReview && data.needsReview > 0 ? (
            <div className="sec banner warn" role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
              <span>
                수업 시간이 0분으로 기록된 {data.needsReview}건은 정산 합계에서 제외됐어요. 관리자
                검토 후 반영됩니다.
              </span>
            </div>
          ) : null}

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
                        {lesson.needsReview ? (
                          <span className="bst warn" style={{ marginLeft: 8 }}>
                            검토 필요
                          </span>
                        ) : null}
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
