"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

type Tab = "plans" | "questions";

type PlanRow = {
  id: string;
  studentName: string;
  date: string;
  taskCount: number;
  completionRate: number;
  hasComment: boolean;
  tasks: { id: string; title: string; isDone: boolean }[];
  comment: string | null;
};

type QuestionRow = {
  id: string;
  studentName: string;
  date: string;
  contentPreview: string;
  hasAiAnswer: boolean;
  hasTeacherAnswer: boolean;
  isResolved: boolean;
  content: string;
  aiAnswer: string | null;
  teacherAnswer: string | null;
};

export function AdminDataPage() {
  const [tab, setTab] = useState<Tab>("plans");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [resolved, setResolved] = useState("");
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "30" });
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    if (tab === "plans") {
      const res = await fetch(`/api/admin/data/plans?${params}`);
      if (res.ok) {
        const data = (await res.json()) as { plans: PlanRow[] };
        setPlans(data.plans);
      }
    } else {
      if (resolved) params.set("resolved", resolved);
      const res = await fetch(`/api/admin/data/questions?${params}`);
      if (res.ok) {
        const data = (await res.json()) as { questions: QuestionRow[] };
        setQuestions(data.questions);
      }
    }
    setLoading(false);
  }, [tab, q, from, to, resolved]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <h2 className="text-2xl font-black text-text-primary">전체 데이터</h2>

      <div className="mt-4 flex gap-4 border-b border-gray-200">
        {(
          [
            { key: "plans" as const, label: "학습계획" },
            { key: "questions" as const, label: "질문/답변" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              setExpandedPlan(null);
              setExpandedQuestion(null);
            }}
            className={`border-b-2 pb-3 text-sm font-semibold ${
              tab === t.key ? "border-primary text-text-primary" : "border-transparent text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="학생 이름"
          className="w-full rounded-xl border px-3 py-2 text-sm sm:w-auto sm:min-w-[180px]"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm sm:w-auto"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm sm:w-auto"
        />
        {tab === "questions" && (
          <select
            value={resolved}
            onChange={(e) => setResolved(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm sm:w-auto"
          >
            <option value="">해결 여부 전체</option>
            <option value="true">해결됨</option>
            <option value="false">미해결</option>
          </select>
        )}
        <button
          type="button"
          onClick={() => fetchData()}
          className="w-full rounded-xl bg-text-primary px-4 py-2 text-sm text-white sm:w-auto"
        >
          조회
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-text-muted">불러오는 중…</p>
      ) : tab === "plans" ? (
        <>
          <div className="mt-6 space-y-4 md:hidden">
            {plans.length === 0 ? (
              <div className="rounded-2xl border bg-white px-4 py-8 text-center text-text-muted shadow-sm">
                데이터가 없습니다.
              </div>
            ) : (
              plans.map((p) => (
                <article key={p.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-text-primary">{p.studentName}</h3>
                      <p className="mt-1 text-sm text-text-secondary">{p.date}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedPlan((id) => (id === p.id ? null : p.id))}
                      className="text-sm font-medium text-primary"
                    >
                      {expandedPlan === p.id ? "닫기" : "상세"}
                    </button>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-xl bg-background px-2 py-3">
                      <dt className="text-xs text-text-muted">태스크</dt>
                      <dd className="mt-1 font-semibold text-text-primary">{p.taskCount}</dd>
                    </div>
                    <div className="rounded-xl bg-background px-2 py-3">
                      <dt className="text-xs text-text-muted">완료율</dt>
                      <dd className="mt-1 font-semibold text-text-primary">{p.completionRate}%</dd>
                    </div>
                    <div className="rounded-xl bg-background px-2 py-3">
                      <dt className="text-xs text-text-muted">코멘트</dt>
                      <dd className="mt-1 font-semibold text-text-primary">{p.hasComment ? "있음" : "—"}</dd>
                    </div>
                  </dl>
                  {expandedPlan === p.id ? (
                    <div className="mt-4 rounded-xl bg-background px-4 py-3">
                      <ul className="space-y-1 text-sm">
                        {p.tasks.map((t) => (
                          <li key={t.id}>
                            {t.isDone ? "✓" : "○"} {t.title}
                          </li>
                        ))}
                      </ul>
                      {p.comment ? (
                        <p className="mt-3 text-sm text-text-secondary">코멘트: {p.comment}</p>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
          <div className="mt-6 hidden overflow-x-auto rounded-2xl border bg-white shadow-sm md:block">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-text-muted">
              <tr>
                <th className="px-4 py-3">학생</th>
                <th className="px-4 py-3">날짜</th>
                <th className="px-4 py-3">태스크</th>
                <th className="px-4 py-3">완료율</th>
                <th className="px-4 py-3">코멘트</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <Fragment key={p.id}>
                  <tr
                    key={p.id}
                    className="cursor-pointer border-b hover:bg-gray-50"
                    onClick={() =>
                      setExpandedPlan((id) => (id === p.id ? null : p.id))
                    }
                  >
                    <td className="px-4 py-3">{p.studentName}</td>
                    <td className="px-4 py-3">{p.date}</td>
                    <td className="px-4 py-3">{p.taskCount}</td>
                    <td className="px-4 py-3">{p.completionRate}%</td>
                    <td className="px-4 py-3">{p.hasComment ? "있음" : "—"}</td>
                  </tr>
                  {expandedPlan === p.id && (
                    <tr key={`${p.id}-detail`}>
                      <td colSpan={5} className="bg-background px-6 py-4">
                        <ul className="space-y-1 text-sm">
                          {p.tasks.map((t) => (
                            <li key={t.id}>
                              {t.isDone ? "✓" : "○"} {t.title}
                            </li>
                          ))}
                        </ul>
                        {p.comment && (
                          <p className="mt-3 text-sm text-text-secondary">
                            코멘트: {p.comment}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          </div>
        </>
      ) : (
        <>
          <div className="mt-6 space-y-4 md:hidden">
            {questions.length === 0 ? (
              <div className="rounded-2xl border bg-white px-4 py-8 text-center text-text-muted shadow-sm">
                데이터가 없습니다.
              </div>
            ) : (
              questions.map((qrow) => (
                <article key={qrow.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-text-primary">{qrow.studentName}</h3>
                      <p className="mt-1 text-sm text-text-secondary">{qrow.date}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedQuestion((id) => (id === qrow.id ? null : qrow.id))}
                      className="text-sm font-medium text-primary"
                    >
                      {expandedQuestion === qrow.id ? "닫기" : "상세"}
                    </button>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-text-primary">{qrow.contentPreview}</p>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-xl bg-background px-2 py-3">
                      <dt className="text-xs text-text-muted">AI</dt>
                      <dd className="mt-1 font-semibold text-text-primary">{qrow.hasAiAnswer ? "Y" : "—"}</dd>
                    </div>
                    <div className="rounded-xl bg-background px-2 py-3">
                      <dt className="text-xs text-text-muted">선생님</dt>
                      <dd className="mt-1 font-semibold text-text-primary">
                        {qrow.hasTeacherAnswer ? "Y" : "—"}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-background px-2 py-3">
                      <dt className="text-xs text-text-muted">해결</dt>
                      <dd className="mt-1 font-semibold text-text-primary">{qrow.isResolved ? "Y" : "—"}</dd>
                    </div>
                  </dl>
                  {expandedQuestion === qrow.id ? (
                    <div className="mt-4 space-y-3 rounded-xl bg-background px-4 py-3 text-sm">
                      <p className="whitespace-pre-wrap text-text-primary">{qrow.content}</p>
                      {qrow.aiAnswer ? (
                        <div className="rounded-lg bg-primary/10 p-3">
                          <p className="text-xs font-semibold text-primary">AI 답변</p>
                          <p className="mt-1 whitespace-pre-wrap text-text-primary">{qrow.aiAnswer}</p>
                        </div>
                      ) : null}
                      {qrow.teacherAnswer ? (
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs font-semibold text-text-primary">선생님 답변</p>
                          <p className="mt-1 whitespace-pre-wrap text-text-primary">{qrow.teacherAnswer}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
          <div className="mt-6 hidden overflow-x-auto rounded-2xl border bg-white shadow-sm md:block">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-text-muted">
              <tr>
                <th className="px-4 py-3">학생</th>
                <th className="px-4 py-3">날짜</th>
                <th className="px-4 py-3">질문</th>
                <th className="px-4 py-3">AI</th>
                <th className="px-4 py-3">선생님</th>
                <th className="px-4 py-3">해결</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((qrow) => (
                <Fragment key={qrow.id}>
                  <tr
                    key={qrow.id}
                    className="cursor-pointer border-b hover:bg-gray-50"
                    onClick={() =>
                      setExpandedQuestion((id) => (id === qrow.id ? null : qrow.id))
                    }
                  >
                    <td className="px-4 py-3">{qrow.studentName}</td>
                    <td className="px-4 py-3">{qrow.date}</td>
                    <td className="max-w-xs truncate px-4 py-3">{qrow.contentPreview}</td>
                    <td className="px-4 py-3">{qrow.hasAiAnswer ? "Y" : "—"}</td>
                    <td className="px-4 py-3">{qrow.hasTeacherAnswer ? "Y" : "—"}</td>
                    <td className="px-4 py-3">{qrow.isResolved ? "Y" : "—"}</td>
                  </tr>
                  {expandedQuestion === qrow.id && (
                    <tr key={`${qrow.id}-detail`}>
                      <td colSpan={6} className="space-y-3 bg-background px-6 py-4 text-sm">
                        <p className="whitespace-pre-wrap">{qrow.content}</p>
                        {qrow.aiAnswer && (
                          <div className="rounded-lg bg-primary/10 p-3">
                            <p className="text-xs font-semibold text-primary">AI 답변</p>
                            <p className="mt-1 whitespace-pre-wrap">{qrow.aiAnswer}</p>
                          </div>
                        )}
                        {qrow.teacherAnswer && (
                          <div className="rounded-lg bg-background p-3">
                            <p className="text-xs font-semibold text-text-primary">선생님 답변</p>
                            <p className="mt-1 whitespace-pre-wrap text-text-primary">{qrow.teacherAnswer}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}
