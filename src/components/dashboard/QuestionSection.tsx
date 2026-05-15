"use client";

import { useCallback, useEffect, useState } from "react";

import { uploadQuestionImage } from "@/lib/supabase-client";

import { AddQuestionModal } from "./AddQuestionModal";
import { QuestionCard } from "./QuestionCard";
import type { Question } from "./types";

type QuestionSectionProps = {
  selectedDate: string;
  studentId: string;
  aiAnswerEnabled: boolean;
};

export function QuestionSection({
  selectedDate,
  studentId,
  aiAnswerEnabled,
}: QuestionSectionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoadingIds, setAiLoadingIds] = useState<Set<string>>(new Set());

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/questions?date=${selectedDate}`);
      if (!res.ok) return;
      const data = (await res.json()) as { questions: Question[] };
      setQuestions(data.questions);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  async function requestAiAnswer(questionId: string) {
    setAiLoadingIds((prev) => new Set(prev).add(questionId));
    try {
      const res = await fetch(`/api/questions/${questionId}/ai-answer`, {
        method: "POST",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { aiAnswer: string };
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, aiAnswer: data.aiAnswer } : q,
        ),
      );
    } finally {
      setAiLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  }

  async function handleSubmit(content: string, imageFile: File | null) {
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        try {
          imageUrl = await uploadQuestionImage(studentId, imageFile);
        } catch {
          throw new Error("이미지 업로드에 실패했습니다. Supabase Storage 설정을 확인해 주세요.");
        }
      }

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          content,
          imageUrl: imageUrl ?? null,
        }),
      });
      if (!res.ok) return;

      const data = (await res.json()) as { question: Question };
      const newQuestion = data.question;
      setQuestions((prev) => [newQuestion, ...prev]);
      setModalOpen(false);
      setAiLoadingIds((prev) => new Set(prev).add(newQuestion.id));
      await requestAiAnswer(newQuestion.id);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkResolved(id: string) {
    const res = await fetch(`/api/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isResolved: true }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { question: Question };
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? data.question : q)),
    );
  }

  return (
    <section className="mt-10 border-t border-gray-200 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-text-dark">질문</h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-white hover:bg-gold/90"
        >
          질문 등록
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-center text-sm text-text-light">질문을 불러오는 중…</p>
      ) : questions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-card p-8 text-center">
          <p className="text-sm text-text-mid">이 날짜에 등록된 질문이 없습니다.</p>
          <p className="mt-1 text-xs text-text-light">
            학습 중 궁금한 점을 질문해 보세요.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {questions.map((q) => (
            <li key={q.id}>
              <QuestionCard
                question={q}
                aiAnswerEnabled={aiAnswerEnabled}
                aiLoading={aiLoadingIds.has(q.id)}
                onMarkResolved={handleMarkResolved}
              />
            </li>
          ))}
        </ul>
      )}

      <AddQuestionModal
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </section>
  );
}
