"use client";

import { useState } from "react";

import { ImageLightbox } from "./ImageLightbox";
import type { Question } from "./types";

type QuestionCardProps = {
  question: Question;
  aiAnswerEnabled: boolean;
  aiLoading: boolean;
};

/** 오늘이면 HH:MM, 이전이면 M/D (KST) — /questions 채팅 뷰와 동일 포맷. */
function formatMsgTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const sameDay =
    kst.getUTCFullYear() === now.getUTCFullYear() &&
    kst.getUTCMonth() === now.getUTCMonth() &&
    kst.getUTCDate() === now.getUTCDate();
  if (sameDay) {
    const hh = String(kst.getUTCHours()).padStart(2, "0");
    const mm = String(kst.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return `${kst.getUTCMonth() + 1}/${kst.getUTCDate()}`;
}

function AiSpinner() {
  return (
    <span
      className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
      aria-hidden
    />
  );
}

/**
 * 하나의 질문 스레드를 채팅형 말풍선으로 렌더한다.
 * 학생 질문(오른쪽) → AI 즉답 → 선생님 답변(왼쪽)이 시간순으로 이어지는 멘탈모델.
 * 학생 수동 "해결됨" 조작은 노출하지 않는다 (isResolved 데이터는 유지).
 */
export function QuestionCard({ question, aiAnswerEnabled, aiLoading }: QuestionCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const hasTeacherAnswer = Boolean(question.teacherAnswer);
  const showAiContent = aiAnswerEnabled && !aiLoading && Boolean(question.aiAnswer);
  const showMockAiMessage = !aiAnswerEnabled && !aiLoading && Boolean(question.aiAnswer);
  const time = formatMsgTime(question.createdAt);

  return (
    <div className="flex flex-col gap-3">
      {/* 학생 질문 — 오른쪽 */}
      <div className="flex flex-col items-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-white">
          <p className="whitespace-pre-wrap">{question.content}</p>
          {question.imageUrl && (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="mt-2 block overflow-hidden rounded-xl border border-white/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={question.imageUrl}
                alt="질문 첨부 이미지"
                className="max-h-48 w-auto max-w-full object-cover transition hover:opacity-90"
              />
            </button>
          )}
        </div>
        {time && <span className="mt-1 text-xs text-text-muted">{time}</span>}
      </div>

      {/* AI 즉답 — 왼쪽 */}
      <div className="flex flex-col items-start">
        <span className="mb-1 text-xs font-semibold text-text-muted">AI 즉답</span>
        <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm leading-relaxed text-text-primary">
          {aiLoading ? (
            <div className="flex items-center gap-2 text-text-secondary">
              <AiSpinner />
              <span>AI가 답변을 생성중이에요…</span>
            </div>
          ) : showAiContent || showMockAiMessage ? (
            <p className="whitespace-pre-wrap">{question.aiAnswer}</p>
          ) : !aiAnswerEnabled ? (
            <p className="text-text-secondary">AI 답변 준비중이에요. 선생님이 답변해 드려요.</p>
          ) : (
            <p className="text-text-muted">답변을 기다리는 중이에요.</p>
          )}
        </div>
      </div>

      {/* 선생님 답변 — 왼쪽 (있을 때만) */}
      {hasTeacherAnswer ? (
        <div className="flex flex-col items-start">
          <span className="mb-1 text-xs font-semibold text-text-muted">선생님</span>
          <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-gray-200 bg-surface px-4 py-2.5 text-sm leading-relaxed text-text-primary">
            <p className="whitespace-pre-wrap">{question.teacherAnswer}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start">
          <span className="mb-1 text-xs font-semibold text-text-muted">선생님</span>
          <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-dashed border-gray-200 bg-background px-4 py-2.5 text-sm text-text-secondary">
            선생님이 이어서 확인하고 있어요.
          </div>
        </div>
      )}

      {lightboxOpen && question.imageUrl && (
        <ImageLightbox
          src={question.imageUrl}
          alt="질문 첨부 이미지"
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
