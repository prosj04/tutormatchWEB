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
  const hasAiBody = showAiContent || showMockAiMessage;
  const time = formatMsgTime(question.createdAt);

  return (
    <div className="st-thread">
      {/* 학생 질문 — 오른쪽 */}
      <div className="bwrap me">
        <div className="msg me">
          {question.content}
          {question.imageUrl && (
            <button
              type="button"
              className="st-att"
              onClick={() => setLightboxOpen(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={question.imageUrl} alt="질문 첨부 이미지" />
            </button>
          )}
        </div>
        {time && <span className="time">{time}</span>}
      </div>

      {/* AI 즉답 — 왼쪽, 보더형 + 작은 AI 라벨 */}
      <div className="bwrap them">
        <div className={`msg ai${hasAiBody ? "" : " wait"}`}>
          <span className="ai-tag">AI 즉답</span>
          {aiLoading ? (
            <span className="st-spin-row">
              <span className="st-spin" aria-hidden />
              AI가 답변을 생성중이에요…
            </span>
          ) : hasAiBody ? (
            question.aiAnswer
          ) : !aiAnswerEnabled ? (
            "AI 답변 준비중이에요. 선생님이 답변해 드려요."
          ) : (
            "답변을 기다리는 중이에요."
          )}
        </div>
      </div>

      {/* 선생님 답변 — 왼쪽 */}
      <div className="bwrap them">
        <span className="sndr">선생님</span>
        {hasTeacherAnswer ? (
          <div className="msg them">{question.teacherAnswer}</div>
        ) : (
          <div className="msg them wait">선생님이 이어서 확인하고 있어요.</div>
        )}
      </div>

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
