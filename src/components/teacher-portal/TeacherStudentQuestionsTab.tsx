"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ImageLightbox } from "@/components/dashboard/ImageLightbox";
import { formatCalendarDayLabel } from "@/lib/study-plan-dates";

import type { QuestionItem } from "./teacher-students-types";

type FilterKey = "all" | "unanswered" | "answered";

type TeacherStudentQuestionsTabProps = {
  studentId: string;
};

function TeacherQuestionCard({
  question,
  onAnswerSaved,
}: {
  question: QuestionItem;
  onAnswerSaved: (q: QuestionItem) => void;
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [draft, setDraft] = useState(question.teacherAnswer ?? "");
  const [editing, setEditing] = useState(!question.teacherAnswer);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(question.teacherAnswer ?? "");
    setEditing(!question.teacherAnswer);
  }, [question.id, question.teacherAnswer]);

  async function handleSave() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/questions/${question.id}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherAnswer: draft.trim() }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { question: QuestionItem };
      onAnswerSaved(data.question);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <span className="inline-block rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-text-secondary">
        {formatCalendarDayLabel(question.date)}
      </span>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
        {question.content}
      </p>

      {question.imageUrl && (
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="mt-3 block overflow-hidden rounded-xl border border-gray-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.imageUrl}
            alt="질문 첨부"
            className="h-28 w-auto max-w-full object-cover"
          />
        </button>
      )}

      {question.aiAnswer && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setAiOpen((o) => !o)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {aiOpen ? "AI 답변 숨기기" : "AI 답변 보기"}
          </button>
          {aiOpen && (
            <div className="mt-2 rounded-xl bg-primary/10 p-4">
              <span className="text-xs font-semibold text-primary">AI 답변</span>
              <p className="mt-2 whitespace-pre-wrap text-sm text-text-primary">
                {question.aiAnswer}
              </p>
            </div>
          )}
        </div>
      )}

      <section className="mt-4 rounded-xl bg-surface/95 p-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold">선생님 답변</span>
          {question.teacherAnswer && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-white/80 hover:text-white hover:underline"
            >
              수정
            </button>
          )}
        </div>

        {question.teacherAnswer && !editing ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
            {question.teacherAnswer}
          </p>
        ) : (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              placeholder="답변을 입력하세요"
              className="mt-3 w-full resize-none rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/40"
            />
            <button
              type="button"
              disabled={saving || !draft.trim()}
              onClick={() => void handleSave()}
              className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "등록 중…" : "답변 등록"}
            </button>
          </>
        )}
      </section>

      {lightbox && question.imageUrl && (
        <ImageLightbox
          src={question.imageUrl}
          alt="질문 첨부"
          onClose={() => setLightbox(false)}
        />
      )}
    </article>
  );
}

export function TeacherStudentQuestionsTab({ studentId }: TeacherStudentQuestionsTabProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/students/${studentId}/questions`);
      if (!res.ok) return;
      const data = (await res.json()) as { questions: QuestionItem[] };
      setQuestions(data.questions);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const filtered = useMemo(() => {
    if (filter === "unanswered") {
      return questions.filter((q) => !q.teacherAnswer);
    }
    if (filter === "answered") {
      return questions.filter((q) => Boolean(q.teacherAnswer));
    }
    return questions;
  }, [questions, filter]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "unanswered", label: "미답변" },
    { key: "answered", label: "답변완료" },
  ];

  function handleAnswerSaved(updated: QuestionItem) {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.key
                ? "bg-primary text-white"
                : "border border-gray-200 bg-white text-text-secondary hover:border-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-text-muted">질문을 불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-background py-12 text-center text-sm text-text-secondary">
          {filter === "all" ? "등록된 질문이 없습니다." : "해당 조건의 질문이 없습니다."}
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((q) => (
            <li key={q.id}>
              <TeacherQuestionCard question={q} onAnswerSaved={handleAnswerSaved} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
