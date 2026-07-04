"use client";

import { useCallback, useEffect, useState } from "react";

type UnassignedQuestion = {
  id: string;
  body: string;
  date: string | null;
  isResolved: boolean;
  createdAt: string;
  student: {
    id: string;
    name: string;
    grade: string;
    phone: string;
    region: string | null;
  };
};

export function ManagerUnassignedQuestions() {
  const [questions, setQuestions] = useState<UnassignedQuestion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchQuestions = useCallback(async () => {
    const res = await fetch("/api/manager/questions");
    if (res.ok) {
      const data = (await res.json()) as { questions: UnassignedQuestion[] };
      setQuestions(data.questions);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  async function handleAnswer(questionId: string) {
    const answer = (answerDrafts[questionId] ?? "").trim();
    if (!answer) return;
    setError("");
    setSubmitting(questionId);
    try {
      const res = await fetch("/api/manager/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "답변 등록에 실패했습니다.");
        return;
      }
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } finally {
      setSubmitting(null);
    }
  }

  if (loaded && questions.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-text-primary">
        미배정 학생 질문
        {loaded ? (
          <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            {questions.length}
          </span>
        ) : null}
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        담당 선생님이 아직 없는 학생이 남긴 질문입니다. 답변하거나 전화로 연락해 주세요.
      </p>
      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-4 space-y-4">
        {questions.map((q) => (
          <li key={q.id} className="rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-text-primary">
                {q.student.name}
                <span className="ml-2 text-sm font-normal text-text-secondary">
                  {q.student.grade}
                  {q.student.region ? ` · ${q.student.region}` : ""}
                </span>
              </p>
              <span className="shrink-0 text-xs text-text-muted">
                {new Date(q.createdAt).toLocaleString("ko-KR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-muted">학생 연락처: {q.student.phone}</p>
            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-background px-4 py-3 text-sm text-text-secondary">
              {q.body}
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={answerDrafts[q.id] ?? ""}
                onChange={(e) =>
                  setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                placeholder="답변을 입력하면 학생에게 알림이 갑니다"
                className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              />
              <button
                type="button"
                disabled={submitting === q.id || !(answerDrafts[q.id] ?? "").trim()}
                onClick={() => void handleAnswer(q.id)}
                className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting === q.id ? "등록 중…" : "답변"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
