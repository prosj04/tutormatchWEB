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
    <section className="page on" data-screen-label="데이터">
      <div className="crumb">/admin/data</div>
      <h1>데이터</h1>
      <p className="sub">원본 데이터 조회와 내보내기입니다.</p>

      <div className="sec filters">
        <div className="opts">
          {(
            [
              { key: "plans" as const, label: "학습계획" },
              { key: "questions" as const, label: "질문/답변" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              className="opt"
              aria-pressed={tab === t.key}
              onClick={() => {
                setTab(t.key);
                setExpandedPlan(null);
                setExpandedQuestion(null);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sec filters" style={{ marginTop: 0 }}>
        <input className="inp filled" value={q} onChange={(e) => setQ(e.target.value)} placeholder="학생 이름" />
        <input type="date" className="inp filled" style={{ width: "auto" }} value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="inp filled" style={{ width: "auto" }} value={to} onChange={(e) => setTo(e.target.value)} />
        {tab === "questions" && (
          <select className="inp filled" style={{ width: "auto" }} value={resolved} onChange={(e) => setResolved(e.target.value)}>
            <option value="">해결 여부 전체</option>
            <option value="true">해결됨</option>
            <option value="false">미해결</option>
          </select>
        )}
        <button type="button" className="btn sec sm" onClick={() => fetchData()}>조회</button>
      </div>

      <div className="sec card" style={{ overflow: "hidden", marginTop: 0 }}>
        {loading ? (
          <div className="empty"><b>불러오는 중…</b></div>
        ) : tab === "plans" ? (
          <table className="tbl">
            <thead>
              <tr>
                <th>학생</th>
                <th>날짜</th>
                <th>태스크</th>
                <th>완료율</th>
                <th>코멘트</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr><td colSpan={5}>데이터가 없습니다.</td></tr>
              ) : (
                plans.map((p) => (
                  <Fragment key={p.id}>
                    <tr
                      style={{ cursor: "pointer" }}
                      onClick={() => setExpandedPlan((id) => (id === p.id ? null : p.id))}
                    >
                      <td><b>{p.studentName}</b></td>
                      <td>{p.date}</td>
                      <td className="num">{p.taskCount}</td>
                      <td className="num">{p.completionRate}%</td>
                      <td>{p.hasComment ? "있음" : "—"}</td>
                    </tr>
                    {expandedPlan === p.id && (
                      <tr>
                        <td colSpan={5}>
                          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
                            {p.tasks.map((t) => (
                              <li key={t.id}>{t.isDone ? "✓" : "○"} {t.title}</li>
                            ))}
                          </ul>
                          {p.comment ? <p className="sub" style={{ marginTop: "8px" }}>코멘트: {p.comment}</p> : null}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>학생</th>
                <th>날짜</th>
                <th>질문</th>
                <th>AI</th>
                <th>선생님</th>
                <th>해결</th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr><td colSpan={6}>데이터가 없습니다.</td></tr>
              ) : (
                questions.map((qrow) => (
                  <Fragment key={qrow.id}>
                    <tr
                      style={{ cursor: "pointer" }}
                      onClick={() => setExpandedQuestion((id) => (id === qrow.id ? null : qrow.id))}
                    >
                      <td><b>{qrow.studentName}</b></td>
                      <td>{qrow.date}</td>
                      <td>{qrow.contentPreview}</td>
                      <td>{qrow.hasAiAnswer ? "Y" : "—"}</td>
                      <td>{qrow.hasTeacherAnswer ? "Y" : "—"}</td>
                      <td>{qrow.isResolved ? "Y" : "—"}</td>
                    </tr>
                    {expandedQuestion === qrow.id && (
                      <tr>
                        <td colSpan={6}>
                          <p style={{ whiteSpace: "pre-wrap" }}>{qrow.content}</p>
                          {qrow.aiAnswer && (
                            <div className="banner ok" style={{ marginTop: "10px" }}>
                              <span><b>AI 답변</b> — {qrow.aiAnswer}</span>
                            </div>
                          )}
                          {qrow.teacherAnswer && (
                            <div className="banner info" style={{ marginTop: "10px" }}>
                              <span><b>선생님 답변</b> — {qrow.teacherAnswer}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
