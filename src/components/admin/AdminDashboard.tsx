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
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-sm text-accent">
        {loadError}
      </div>
    );
  }

  if (loading || !stats) {
    return <p className="text-sm text-text-secondary">불러오는 중…</p>;
  }

  const cards = [
    { label: "전체 학생", value: stats.studentCount },
    {
      label: "선생님 (승인/대기)",
      value: `${stats.teacherApproved} / ${stats.teacherPending}`,
    },
    { label: "활성 매칭", value: stats.activeMatches },
    { label: "오늘 질문", value: stats.questionsToday },
    { label: "상담 대기", value: stats.waitingConsultations },
    { label: "상담 진행 중", value: stats.assignedConsultations },
  ];

  return (
    <div>
      <h2 className="text-2xl font-black text-text-primary">대시보드</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {c.label}
            </p>
            <p className="mt-2 text-3xl font-black text-text-primary">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-text-primary">최근 가입 학생</h3>
          <ul className="mt-4 space-y-3">
            {recent.length === 0 ? (
              <li className="text-sm text-text-muted">데이터 없음</li>
            ) : (
              recent.map((s, i) => (
                <li
                  key={`${s.name}-${i}`}
                  className="flex justify-between border-b border-gray-50 pb-2 text-sm last:border-0"
                >
                  <span className="font-medium text-text-primary">{s.name}</span>
                  <span className="text-text-muted">
                    {new Date(s.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-text-primary">답변 대기 질문</h3>
          <p className="mt-4 text-4xl font-black text-accent">
            {stats.unansweredQuestions}
          </p>
          <p className="mt-2 text-sm text-text-secondary">선생님 답변이 없는 질문 수</p>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-text-primary">매니저 업무량</h3>
          <ul className="mt-4 space-y-3">
            {managerLoad.length === 0 ? (
              <li className="text-sm text-text-muted">배정된 매니저 없음</li>
            ) : (
              managerLoad.map((m) => (
                <li
                  key={m.name}
                  className="flex justify-between border-b border-gray-50 pb-2 text-sm last:border-0"
                >
                  <span className="font-medium text-text-primary">{m.name}</span>
                  <span className="tabular-nums text-text-muted">{m.studentCount}명</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-text-primary">알림 자동 체크</h3>
        <p className="mt-2 text-sm text-text-secondary">
          미답변 질문·주간 완료율 알림을 수동으로 실행합니다 (개발/테스트용).
        </p>
        <button
          type="button"
          disabled={cronLoading}
          onClick={async () => {
            setCronLoading(true);
            setCronResult(null);
            try {
              const res = await fetch("/api/admin/check-alerts", {
                method: "POST",
              });
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
          className="mt-4 rounded-xl bg-text-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-90 disabled:opacity-50"
        >
          {cronLoading ? "실행 중…" : "알림 체크 실행"}
        </button>
        {cronResult ? (
          <p className="mt-3 text-sm text-text-primary" role="status">
            {cronResult}
          </p>
        ) : null}
      </section>
    </div>
  );
}
