"use client";

import { useEffect, useState } from "react";

type Stats = {
  studentCount: number;
  teacherApproved: number;
  teacherPending: number;
  activeMatches: number;
  questionsToday: number;
  unansweredQuestions: number;
};

type RecentStudent = { name: string; createdAt: string };

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data: { stats: Stats; recentStudents: RecentStudent[] }) => {
        setStats(data.stats);
        setRecent(data.recentStudents);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <p className="text-sm text-text-mid">불러오는 중…</p>;
  }

  const cards = [
    { label: "전체 학생", value: stats.studentCount },
    {
      label: "선생님 (승인/대기)",
      value: `${stats.teacherApproved} / ${stats.teacherPending}`,
    },
    { label: "활성 매칭", value: stats.activeMatches },
    { label: "오늘 질문", value: stats.questionsToday },
  ];

  return (
    <div>
      <h2 className="text-2xl font-black text-text-dark">대시보드</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-text-light">
              {c.label}
            </p>
            <p className="mt-2 text-3xl font-black text-text-dark">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-text-dark">최근 가입 학생</h3>
          <ul className="mt-4 space-y-3">
            {recent.length === 0 ? (
              <li className="text-sm text-text-light">데이터 없음</li>
            ) : (
              recent.map((s, i) => (
                <li
                  key={`${s.name}-${i}`}
                  className="flex justify-between border-b border-gray-50 pb-2 text-sm last:border-0"
                >
                  <span className="font-medium text-text-dark">{s.name}</span>
                  <span className="text-text-light">
                    {new Date(s.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-text-dark">답변 대기 질문</h3>
          <p className="mt-4 text-4xl font-black text-accent">
            {stats.unansweredQuestions}
          </p>
          <p className="mt-2 text-sm text-text-mid">선생님 답변이 없는 질문 수</p>
        </section>
      </div>
    </div>
  );
}
