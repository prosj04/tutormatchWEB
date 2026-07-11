"use client";

import { useEffect, useState } from "react";

type Stats = {
  studentCount: number;
  teacherApproved: number;
  teacherPending: number;
  activeMatches: number;
  questionsToday: number;
  unansweredQuestions: number;
  waitingConsultations: number;
  assignedConsultations: number;
};

type RecentStudent = { name: string; createdAt: string };
type ManagerLoad = { name: string; studentCount: number };

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentStudent[]>([]);
  const [managerLoad, setManagerLoad] = useState<ManagerLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cronLoading, setCronLoading] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        if (!r.ok) {
          const data = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `요청 실패 (${r.status})`);
        }
        return r.json() as Promise<{ stats: Stats; recentStudents: RecentStudent[] }>;
      })
      .then((data) => {
        setStats(data.stats);
        setRecent(data.recentStudents);
        setManagerLoad((data as { managerLoad?: ManagerLoad[] }).managerLoad ?? []);
      })
      .catch(() => {
        setLoadError("대시보드 데이터를 불러오지 못했습니다. 관리자로 다시 로그인했는지 확인해 주세요.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loadError) {
    return (
      <section className="page on" data-screen-label="어드민 대시보드">
        <div className="crumb">/admin</div>
        <h1>어드민 대시보드</h1>
        <div className="sec banner err">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          <span>{loadError}</span>
        </div>
      </section>
    );
  }

  if (loading || !stats) {
    return (
      <section className="page on" data-screen-label="어드민 대시보드">
        <div className="crumb">/admin</div>
        <h1>어드민 대시보드</h1>
        <p className="sub">불러오는 중…</p>
      </section>
    );
  }

  const maxLoad = Math.max(1, ...managerLoad.map((m) => m.studentCount));

  return (
    <section className="page on" data-screen-label="어드민 대시보드">
      <div className="crumb">/admin</div>
      <h1>어드민 대시보드</h1>
      <p className="sub">핵심 지표와 미처리 항목입니다.</p>

      <div className="sec grid3">
        <div className="card kpi">
          <b>{stats.studentCount}</b>
          <span>전체 학생</span>
        </div>
        <div className="card kpi">
          <b>{stats.teacherApproved}<em>/{stats.teacherPending} 대기</em></b>
          <span>선생님 (승인)</span>
        </div>
        <div className="card kpi">
          <b>{stats.activeMatches}</b>
          <span>활성 매칭</span>
        </div>
        <div className="card kpi">
          <b>{stats.questionsToday}</b>
          <span>오늘 질문</span>
        </div>
        <div className="card kpi">
          <b>{stats.waitingConsultations}</b>
          <span>상담 대기</span>
        </div>
        <div className="card kpi">
          <b>{stats.assignedConsultations}</b>
          <span>상담 진행 중</span>
        </div>
      </div>

      <div className="sec grid2">
        <div className="card">
          <h2 style={{ fontSize: "15px", fontWeight: 700, padding: "18px 20px 4px" }}>미처리 항목</h2>
          <div className="row">
            <div className="g">
              <b>선생님 승인 대기</b>
              <p>서류 확인 필요 {stats.teacherPending}건</p>
            </div>
            <a className="btn sec sm" href="/admin/teachers">처리</a>
          </div>
          <div className="row">
            <div className="g">
              <b>답변 대기 질문</b>
              <p>선생님 답변이 없는 질문 {stats.unansweredQuestions}건</p>
            </div>
            <a className="btn sec sm" href="/admin/data">처리</a>
          </div>
          <div className="row">
            <div className="g">
              <b>미배정 상담 리드</b>
              <p>상담 대기 {stats.waitingConsultations}건</p>
            </div>
            <a className="btn sec sm" href="/admin/leads">처리</a>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "15px", fontWeight: 700, padding: "18px 20px 0" }}>매니저 업무량</h2>
          {managerLoad.length === 0 ? (
            <div className="empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
              <b>배정된 매니저 없음</b>
            </div>
          ) : (
            <div className="bars">
              {managerLoad.map((m) => (
                <div key={m.name} className="b">
                  <i style={{ height: `${Math.max(8, (m.studentCount / maxLoad) * 100)}%` }}></i>
                  <span>{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sec card">
        <h2 style={{ fontSize: "15px", fontWeight: 700, padding: "18px 20px 4px" }}>최근 가입 학생</h2>
        {recent.length === 0 ? (
          <div className="empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l10-4 10 4-10 4z" /><path d="M6 10v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></svg>
            <b>데이터 없음</b>
          </div>
        ) : (
          recent.map((s, i) => (
            <div key={`${s.name}-${i}`} className="row">
              <div className="g">
                <b>{s.name}</b>
              </div>
              <span className="r">{new Date(s.createdAt).toLocaleDateString("ko-KR")}</span>
            </div>
          ))
        )}
      </div>

      <div className="sec card">
        <h2 style={{ fontSize: "15px", fontWeight: 700, padding: "18px 20px 4px" }}>알림 자동 체크</h2>
        <div className="row">
          <div className="g">
            <b>미답변 질문·주간 완료율 알림</b>
            <p>수동으로 실행합니다 (개발/테스트용).{cronResult ? ` — ${cronResult}` : ""}</p>
          </div>
          <button
            type="button"
            className="btn sec sm"
            disabled={cronLoading}
            onClick={async () => {
              setCronLoading(true);
              setCronResult(null);
              try {
                const res = await fetch("/api/admin/check-alerts", { method: "POST" });
                const data = (await res.json()) as {
                  checked?: number;
                  notificationsCreated?: number;
                  error?: string;
                };
                if (!res.ok) {
                  setCronResult(data.error ?? "실행 실패");
                  return;
                }
                setCronResult(
                  `질문 ${data.checked ?? 0}개 확인, 알림 ${data.notificationsCreated ?? 0}개 생성됨`,
                );
              } catch {
                setCronResult("실행 중 오류가 발생했습니다.");
              } finally {
                setCronLoading(false);
              }
            }}
          >
            {cronLoading ? "실행 중…" : "알림 체크 실행"}
          </button>
        </div>
      </div>
    </section>
  );
}
