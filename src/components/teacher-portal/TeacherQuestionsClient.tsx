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
      <div className="crumb">질문</div>
      <h1>질문</h1>
      <p className="sub">담당 학생 질문에 답변합니다. 사진 첨부를 함께 확인하세요.</p>

      {students.length === 0 ? (
        <div className="sec">
          <p className="sf-sub">배정된 학생이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="sec">
            <TeacherStudentPicker
              students={students}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          <div className="sec sf-split">
            <div className="sf-block">
              {loading ? (
                <p className="sf-sub">질문을 불러오는 중…</p>
              ) : questions.length === 0 ? (
                <p className="sf-sub">등록된 질문이 없습니다.</p>
              ) : (
                <div className="sf-rows">
                  {questions.map((q) => {
                    const answered = Boolean(q.teacherAnswer);
                    const isActive = q.id === activeId;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        className={isActive ? "sf-r on" : "sf-r"}
                        onClick={() => handleSelect(q)}
                      >
                        <span className="av">{selected ? initial(selected.name) : "?"}</span>
                        <span className="sf-g">
                          <b>{q.content.split("\n")[0].slice(0, 30) || "질문"}</b>
                          <p>
                            {selected?.name ?? ""} · {q.imageUrl ? "사진 1장 · " : ""}
                            {formatCalendarDayLabel(q.date)}
                            {q.aiAnswer ? "" : " · AI 미해결"}
                            {isActive ? " · 선택됨" : ""}
                          </p>
                        </span>
                        {answered ? (
                          <span className="bst acc">완료</span>
                        ) : (
                          <span className="bst warn">대기</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="sf-chat">
              {active ? (
                <div className="chat">
                  <div className="chat-head">
                    <span className="av">{selected ? initial(selected.name) : "?"}</span>
                    <span>
                      <b>{selected?.name ?? ""}</b>
                      <p>{formatCalendarDayLabel(active.date)}</p>
                    </span>
                  </div>
                  <div className="chat-scroll">
                    <div className="bwrap them">
                      <span className="sndr">{selected?.name ?? ""}</span>
                      <div className="msg them">
                        {active.content}
                        {active.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="sf-q-att" src={active.imageUrl} alt="질문 첨부" />
                        ) : null}
                      </div>
                    </div>
                    {active.aiAnswer ? (
                      <div className="bwrap them">
                        <div className="msg ai">
                          <span className="ai-tag">AI 답변</span>
                          {active.aiAnswer}
                        </div>
                      </div>
                    ) : null}
                    {active.teacherAnswer ? (
                      <div className="bwrap me">
                        <div className="msg me">{active.teacherAnswer}</div>
                      </div>
                    ) : null}
                  </div>
                  <div className="composer">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="답변을 입력하세요"
                    />
                    <button
                      type="button"
                      className="send"
                      aria-label={saving ? "보내는 중…" : "답변 보내기"}
                      disabled={saving || !draft.trim()}
                      onClick={() => void handleSend()}
                    >
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>
                    </button>
                  </div>
                  {message ? (
                    <div className="chat-note">
                      <p role="status" style={{ color: "var(--acc-text)" }}>
                        {message}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="sf-sub" style={{ paddingTop: 18 }}>
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
