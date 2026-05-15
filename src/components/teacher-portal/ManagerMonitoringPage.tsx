"use client";

import { useCallback, useEffect, useState } from "react";

import { formatConsultationDateLabel } from "@/lib/study-plan-dates";

type Overview = {
  studentCount: number;
  avgCompletionRate: number;
  staleQuestions: number;
  atRiskCount: number;
};

type StudentRow = {
  id: string;
  name: string;
  grade: string;
  teacherName: string;
  completionRate: number;
  unansweredStale: number;
  statusLabel: string;
  statusClassName: string;
};

type DetailPlan = {
  id: string;
  date: string;
  tasks: { id: string; title: string; isDone: boolean }[];
  comment: string | null;
};

type DetailData = {
  student: { name: string; grade: string } | null;
  plans: DetailPlan[];
  unansweredQuestions: {
    id: string;
    date: string;
    content: string;
    createdAt: string;
  }[];
  recentComments: { date: string; comment: string | null; commentAt: string | null }[];
};

export function ManagerMonitoringPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/manager/monitoring");
      if (!res.ok) return;
      const data = (await res.json()) as {
        overview: Overview;
        students: StudentRow[];
      };
      setOverview(data.overview);
      setStudents(data.students);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openDrawer = async (studentId: string) => {
    setDrawerId(studentId);
    setDetailLoading(true);
    try {
      const res = await fetch(
        `/api/manager/monitoring/stats?studentId=${encodeURIComponent(studentId)}`,
      );
      if (res.ok) {
        setDetail((await res.json()) as DetailData);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const cards = [
    { label: "담당 학생 수", value: overview?.studentCount ?? "—" },
    {
      label: "이번 주 평균 완료율",
      value: overview ? `${overview.avgCompletionRate}%` : "—",
    },
    {
      label: "미답변 질문 (24h+)",
      value: overview?.staleQuestions ?? "—",
    },
    { label: "주의 학생 수", value: overview?.atRiskCount ?? "—" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black text-text-dark sm:text-3xl">모니터링</h1>
      <p className="mt-2 text-sm text-text-mid">
        매칭한 학생들의 학습 현황을 확인합니다.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-gray-200 bg-card p-5 shadow-sm"
          >
            <p className="text-xs font-medium text-text-mid">{c.label}</p>
            <p className="mt-2 text-2xl font-black text-navy">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-gray-200 bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-background/80 text-xs uppercase text-text-light">
            <tr>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">학년</th>
              <th className="px-4 py-3">담당선생님</th>
              <th className="px-4 py-3">이번주완료율</th>
              <th className="px-4 py-3">미답변질문</th>
              <th className="px-4 py-3">상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-mid">
                  불러오는 중…
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-mid">
                  담당 학생이 없습니다.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => void openDrawer(s.id)}
                  className="cursor-pointer border-b border-gray-50 transition hover:bg-gold/5"
                >
                  <td className="px-4 py-3 font-medium text-text-dark">{s.name}</td>
                  <td className="px-4 py-3 text-text-mid">{s.grade}</td>
                  <td className="px-4 py-3 text-text-mid">{s.teacherName}</td>
                  <td className="px-4 py-3">{s.completionRate}%</td>
                  <td className="px-4 py-3">{s.unansweredStale}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.statusClassName}`}
                    >
                      {s.statusLabel}
                      {s.statusLabel === "주의" ? " ⚠️" : ""}
                      {s.statusLabel === "위험" ? " 🔴" : ""}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {drawerId ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          onClick={() => setDrawerId(null)}
          role="presentation"
        >
          <div
            className="h-full w-full max-w-lg overflow-y-auto bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-card px-5 py-4">
              <h2 className="text-lg font-bold text-navy">
                {detail?.student?.name ?? "학생 상세"}
              </h2>
              <button
                type="button"
                onClick={() => setDrawerId(null)}
                className="text-sm text-text-mid hover:text-text-dark"
              >
                닫기
              </button>
            </div>
            <div className="p-5">
              {detailLoading ? (
                <p className="text-sm text-text-mid">불러오는 중…</p>
              ) : detail ? (
                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm font-semibold text-text-dark">
                      이번 주 학습계획
                    </h3>
                    {detail.plans.length === 0 ? (
                      <p className="mt-2 text-sm text-text-mid">계획 없음</p>
                    ) : (
                      <ul className="mt-3 space-y-4">
                        {detail.plans.map((plan) => (
                          <li
                            key={plan.id}
                            className="rounded-xl border border-gray-100 p-3"
                          >
                            <p className="text-xs font-medium text-navy">
                              {formatConsultationDateLabel(plan.date)}
                            </p>
                            <ul className="mt-2 space-y-1">
                              {plan.tasks.map((t) => (
                                <li
                                  key={t.id}
                                  className={`text-sm ${t.isDone ? "text-text-light line-through" : "text-text-dark"}`}
                                >
                                  {t.title}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-text-dark">
                      미답변 질문 (24h+)
                    </h3>
                    {detail.unansweredQuestions.length === 0 ? (
                      <p className="mt-2 text-sm text-text-mid">없음</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {detail.unansweredQuestions.map((q) => (
                          <li
                            key={q.id}
                            className="rounded-lg bg-orange-50 px-3 py-2 text-sm"
                          >
                            <p className="text-xs text-text-mid">{q.date}</p>
                            <p className="mt-1 text-text-dark">{q.content}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-text-dark">
                      최근 선생님 코멘트
                    </h3>
                    {detail.recentComments.length === 0 ? (
                      <p className="mt-2 text-sm text-text-mid">없음</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {detail.recentComments.map((c) => (
                          <li
                            key={c.date}
                            className="rounded-lg bg-gold/5 px-3 py-2 text-sm"
                          >
                            <p className="text-xs text-gold">{c.date}</p>
                            <p className="mt-1 text-text-dark">{c.comment}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
