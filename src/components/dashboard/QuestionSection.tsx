"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";
import { uploadQuestionImage } from "@/lib/supabase-client";

import { AddQuestionModal } from "./AddQuestionModal";
import { QuestionCard } from "./QuestionCard";
import type { Question } from "./types";

type QuestionSectionProps = {
  selectedDate: string;
  studentId: string;
  aiAnswerEnabled: boolean;
  initialQuestions: Question[];
  isEditMode?: boolean;
};

export function QuestionSection({
  selectedDate,
  studentId,
  aiAnswerEnabled,
  initialQuestions,
  isEditMode = false,
}: QuestionSectionProps) {
  const sectionTitle = usePortalCopy("student_questions", "section_title", "질문");
  const btnAdd = usePortalCopy("student_questions", "btn_add", "질문 등록");
  const loadingQuestions = usePortalCopy("student_questions", "loading", "질문을 불러오는 중…");
  const emptyTitle = usePortalCopy(
    "student_questions",
    "empty_title",
    "이 날짜에 등록된 질문이 없습니다.",
  );
  const emptyHint = usePortalCopy(
    "student_questions",
    "empty_hint",
    "학습 중 궁금한 점을 질문해 보세요.",
  );
  const errUpload = usePortalCopy(
    "student_questions",
    "err_upload",
    "이미지 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  );

  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoadingIds, setAiLoadingIds] = useState<Set<string>>(new Set());
  const skipInitialFetchRef = useRef(true);

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
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    void fetchQuestions();
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
          throw new Error(errUpload);
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
      if (aiAnswerEnabled && !newQuestion.aiAnswer) {
        void requestAiAnswer(newQuestion.id);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-10 border-t border-gray-200 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-text-primary">
          <CmsEdit active={isEditMode} section="student_questions" cmsKey="section_title" type="text">
            {sectionTitle}
          </CmsEdit>
        </h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <CmsEdit active={isEditMode} section="student_questions" cmsKey="btn_add" type="text">
            {btnAdd}
          </CmsEdit>
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-center text-sm text-text-muted">
          <CmsEdit active={isEditMode} section="student_questions" cmsKey="loading" type="text">
            {loadingQuestions}
          </CmsEdit>
        </p>
      ) : questions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-surface p-8 text-center">
          <p className="text-sm text-text-secondary">
            <CmsEdit active={isEditMode} section="student_questions" cmsKey="empty_title" type="text">
              {emptyTitle}
            </CmsEdit>
          </p>
          <p className="mt-1 text-xs text-text-muted">
            <CmsEdit active={isEditMode} section="student_questions" cmsKey="empty_hint" type="text">
              {emptyHint}
            </CmsEdit>
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-8">
          {questions.map((q) => (
            <li key={q.id}>
              <QuestionCard
                question={q}
                aiAnswerEnabled={aiAnswerEnabled}
                aiLoading={aiLoadingIds.has(q.id)}
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
