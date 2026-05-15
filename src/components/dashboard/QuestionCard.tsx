"use client";

import { useState } from "react";

import { ImageLightbox } from "./ImageLightbox";
import type { Question } from "./types";

type QuestionCardProps = {
  question: Question;
  aiAnswerEnabled: boolean;
  aiLoading: boolean;
  onMarkResolved: (id: string) => void;
};

function AiSpinner() {
  return (
    <span
      className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-gold/30 border-t-gold"
      aria-hidden
    />
  );
}

export function QuestionCard({
  question,
  aiAnswerEnabled,
  aiLoading,
  onMarkResolved,
}: QuestionCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const hasTeacherAnswer = Boolean(question.teacherAnswer);
  const showMockAiMessage =
    !aiAnswerEnabled && !aiLoading && Boolean(question.aiAnswer);
  const showAiContent =
    aiAnswerEnabled && !aiLoading && Boolean(question.aiAnswer);

  return (
    <article className="rounded-2xl border border-gray-100 bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-dark">
          {question.content}
        </p>
        {question.isResolved && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            해결됨
          </span>
        )}
      </div>

      {question.imageUrl && (
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="mt-3 block overflow-hidden rounded-xl border border-gray-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.imageUrl}
            alt="질문 첨부 이미지"
            className="h-32 w-auto max-w-full object-cover transition hover:opacity-90"
          />
        </button>
      )}

      <section className="mt-4 rounded-xl bg-gold/10 p-4">
        <div className="flex items-center gap-2">
          <span aria-hidden>🤖</span>
          {aiAnswerEnabled ? (
            <span className="inline-block rounded-full bg-gold/25 px-2.5 py-0.5 text-xs font-semibold text-gold">
              AI 답변
            </span>
          ) : (
            <span className="inline-block rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-text-mid">
              AI 답변 준비중
            </span>
          )}
        </div>

        {aiLoading ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-text-mid">
            <AiSpinner />
            <span>AI가 답변을 생성중입니다...</span>
          </div>
        ) : showAiContent ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-dark">
            {question.aiAnswer}
          </p>
        ) : showMockAiMessage ? (
          <p className="mt-3 text-sm leading-relaxed text-text-mid">
            {question.aiAnswer}
          </p>
        ) : !aiAnswerEnabled ? (
          <p className="mt-3 text-sm text-text-mid">선생님의 답변을 기다려주세요</p>
        ) : (
          <p className="mt-3 text-sm text-text-light">답변을 기다리는 중입니다.</p>
        )}
      </section>

      <section className="mt-3 rounded-xl bg-navy p-4 text-white">
        <div className="flex flex-wrap items-center gap-2">
          <span aria-hidden>👨‍🏫</span>
          <span className="inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
            선생님 답변
          </span>
          {!hasTeacherAnswer && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/70">
              선생님 답변 대기중
            </span>
          )}
        </div>

        {hasTeacherAnswer ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
            {question.teacherAnswer}
          </p>
        ) : (
          <p className="mt-3 text-sm text-white/60">아직 선생님 답변이 등록되지 않았습니다.</p>
        )}
      </section>

      {hasTeacherAnswer && !question.isResolved && (
        <button
          type="button"
          onClick={() => onMarkResolved(question.id)}
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
        >
          해결됨으로 표시
        </button>
      )}

      {lightboxOpen && question.imageUrl && (
        <ImageLightbox
          src={question.imageUrl}
          alt="질문 첨부 이미지"
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </article>
  );
}
