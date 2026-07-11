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
    <div className="sec">
      <h2>미배정 질문{loaded ? ` ${questions.length}건` : ""}</h2>
      {error ? (
        <div className="banner warn" style={{ marginBottom: "12px" }} role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="card">
        {questions.map((q) => (
          <div className="row" key={q.id}>
            <span className="av">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 1 1 4 2.8c-.8.4-1.1 1-1.1 2M12 17h.01" /></svg>
            </span>
            <div className="g">
              <b>
                {q.student.name} · {q.student.grade}
                {q.student.region ? ` · ${q.student.region}` : ""}
              </b>
              <p>{q.body}</p>
              <div className="field" style={{ marginTop: "10px", marginBottom: 0 }}>
                <input
                  type="text"
                  className="inp filled"
                  value={answerDrafts[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  placeholder="답변을 입력하면 학생에게 알림이 갑니다"
                />
              </div>
            </div>
            <button
              type="button"
              className="btn sec sm"
              disabled={submitting === q.id || !(answerDrafts[q.id] ?? "").trim()}
              onClick={() => void handleAnswer(q.id)}
            >
              {submitting === q.id ? "등록 중…" : "답변"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
