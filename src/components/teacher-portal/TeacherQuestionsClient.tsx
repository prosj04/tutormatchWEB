"use client";

import { useCallback, useEffect, useState } from "react";

import { formatCalendarDayLabel } from "@/lib/study-plan-dates";

import { TeacherStudentPicker } from "./TeacherStudentPicker";
import type { QuestionItem, StudentListItem } from "./teacher-students-types";

type TeacherQuestionsClientProps = {
  initialStudents: StudentListItem[];
};

function initial(name: string) {
  return name.slice(0, 1);
}

export function TeacherQuestionsClient({ initialStudents }: TeacherQuestionsClientProps) {
  const [students] = useState<StudentListItem[]>(initialStudents);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialStudents[0]?.id ?? null,
  );
  const selected = students.find((s) => s.id === selectedId) ?? null;

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    setActiveId(null);
    setDraft("");
    try {
      const res = await fetch(`/api/teacher/students/${selectedId}/questions`);
      if (!res.ok) return;
      const data = (await res.json()) as { questions: QuestionItem[] };
      setQuestions(data.questions);
      const firstPending = data.questions.find((q) => !q.teacherAnswer);
      if (firstPending) {
        setActiveId(firstPending.id);
        setDraft(firstPending.teacherAnswer ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  function handleSelect(question: QuestionItem) {
    setActiveId(question.id);
    setDraft(question.teacherAnswer ?? "");
    setMessage(null);
  }

  const active = questions.find((q) => q.id === activeId) ?? null;

  async function handleSend() {
    if (!active || !draft.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/teacher/questions/${active.id}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherAnswer: draft.trim() }),
      });
      if (!res.ok) {
        setMessage("답변 저장에 실패했습니다.");
        return;
      }
      const data = (await res.json()) as { question: QuestionItem };
      setQuestions((prev) => prev.map((q) => (q.id === data.question.id ? data.question : q)));
      setMessage("답변을 보냈습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page on" id="pg-questions">
      <div className="crumb">/teacher-portal/dashboard/questions</div>
      <h1>질문</h1>
      <p className="sub">담당 학생 질문에 답변합니다. 사진 첨부를 함께 확인하세요.</p>

      {students.length === 0 ? (
        <div className="sec card">
          <div className="row">
            <div className="g">
              <p>배정된 학생이 없습니다.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="sec card" style={{ padding: "20px" }}>
            <TeacherStudentPicker
              students={students}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          <div className="sec grid2">
            <div className="card">
              {loading ? (
                <div className="row">
                  <div className="g">
                    <p>질문을 불러오는 중…</p>
                  </div>
                </div>
              ) : questions.length === 0 ? (
                <div className="row">
                  <div className="g">
                    <p>등록된 질문이 없습니다.</p>
                  </div>
                </div>
              ) : (
                questions.map((q) => {
                  const answered = Boolean(q.teacherAnswer);
                  const isActive = q.id === activeId;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      className="row"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        background: isActive ? "rgba(var(--acc-rgb),.05)" : undefined,
                      }}
                      onClick={() => handleSelect(q)}
                    >
                      <span className="av">{selected ? initial(selected.name) : "?"}</span>
                      <div className="g">
                        <b>{q.content.split("\n")[0].slice(0, 30) || "질문"}</b>
                        <p>
                          {selected?.name ?? ""} · {q.imageUrl ? "사진 1장 · " : ""}
                          {formatCalendarDayLabel(q.date)}
                          {q.aiAnswer ? "" : " · AI 미해결"}
                          {isActive ? " · 선택됨" : ""}
                        </p>
                      </div>
                      {answered ? (
                        <span className="bst acc">완료</span>
                      ) : (
                        <span className="bst warn">대기</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="card" style={{ padding: "20px" }}>
              {active ? (
                <>
                  <h2 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>
                    답변 작성 — {selected?.name ?? ""}
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--mut)",
                      padding: "12px 14px",
                      borderRadius: "11px",
                      background: "var(--panel-2)",
                      marginBottom: "12px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {active.content}
                  </p>
                  {active.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={active.imageUrl}
                      alt="질문 첨부"
                      style={{
                        maxWidth: "100%",
                        borderRadius: "11px",
                        marginBottom: "12px",
                        display: "block",
                      }}
                    />
                  ) : null}
                  {active.aiAnswer ? (
                    <div className="field">
                      <label>AI 답변</label>
                      <div className="inp filled" style={{ whiteSpace: "pre-wrap" }}>
                        {active.aiAnswer}
                      </div>
                    </div>
                  ) : null}
                  <div className="field">
                    <textarea
                      className="inp area filled"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="답변을 입력하세요"
                    />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn pri"
                      disabled={saving || !draft.trim()}
                      onClick={() => void handleSend()}
                    >
                      {saving ? "보내는 중…" : "답변 보내기"}
                    </button>
                  </div>
                  {message ? (
                    <p
                      role="status"
                      style={{ marginTop: "12px", fontSize: "12.5px", color: "var(--acc-text)" }}
                    >
                      {message}
                    </p>
                  ) : null}
                </>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--mut)" }}>
                  왼쪽에서 질문을 선택하면 답변을 작성할 수 있습니다.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
