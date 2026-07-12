"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ImageLightbox } from "@/components/dashboard/ImageLightbox";
import { uploadQuestionImage } from "@/lib/supabase-client";
import type { QnaTimelineMessage } from "@/lib/qna";

type Props = {
  studentId: string;
  studentName: string;
  initialMessages: QnaTimelineMessage[];
  aiAnswerEnabled: boolean;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

/** KST(Asia/Seoul) 기준: 오늘이면 HH:MM, 이전이면 M/D — 모바일 formatMsgTime과 동일. */
function formatMsgTime(iso: string): string {
  const d = new Date(iso);
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

/** 오늘 날짜 YYYY-MM-DD (KST) — 기존 /api/questions POST가 date를 요구하므로 채워 보낸다. */
function todayKst(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function senderLabel(sender: QnaTimelineMessage["sender"], studentName: string): string {
  if (sender === "ai") return "AI 즉답";
  if (sender === "tutor") return "선생님";
  return studentName;
}

function MsgBubble({
  msg,
  studentName,
  onOpenImage,
}: {
  msg: QnaTimelineMessage;
  studentName: string;
  onOpenImage: (url: string) => void;
}) {
  const side = msg.sender === "me" ? "me" : "them";
  const tone = msg.sender === "me" ? "me" : msg.sender === "ai" ? "ai" : "them";
  return (
    <div className={`bwrap ${side}`}>
      {msg.sender !== "me" && (
        <span className="sndr">{senderLabel(msg.sender, studentName)}</span>
      )}
      <div className={`msg ${tone}`}>
        {msg.sender === "ai" && (
          <span className="ai-tag">
            <span aria-hidden>✨</span>
            AI 즉답{msg.tokenCost ? ` · 토큰 ${msg.tokenCost} 사용` : ""}
          </span>
        )}
        {msg.body}
        {msg.imageUrl && (
          <button
            type="button"
            className="att"
            onClick={() => onOpenImage(msg.imageUrl as string)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={msg.imageUrl} alt="질문 첨부 이미지" />
          </button>
        )}
      </div>
      <span className="time">{formatMsgTime(msg.createdAt)}</span>
    </div>
  );
}

export function QuestionsPageClient({
  studentId,
  studentName,
  initialMessages,
  aiAnswerEnabled,
}: Props) {
  const [messages, setMessages] = useState<QnaTimelineMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToEnd = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function handleFileChange(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(".heic")) {
      setError("JPEG, PNG, HEIC 형식만 첨부할 수 있어요.");
      return;
    }
    setError("");
    setImageFile(file);
  }

  async function requestAiAnswer(rootId: string) {
    try {
      const res = await fetch(`/api/questions/${rootId}/ai-answer`, { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as { aiAnswer: string };
      setMessages((prev) => {
        if (prev.some((m) => m.sender === "ai" && m.body === data.aiAnswer)) return prev;
        return [
          ...prev,
          {
            id: `ai-${rootId}`,
            sender: "ai",
            body: data.aiAnswer,
            imageUrl: null,
            tokenCost: 0,
            date: null,
            createdAt: new Date().toISOString(),
          },
        ];
      });
    } catch {
      /* 무음 실패 — 다음 로드 시 반영 */
    }
  }

  async function handleSend() {
    const trimmed = text.trim();
    if ((!trimmed && !imageFile) || sending) return;
    setSending(true);
    setError("");
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        try {
          imageUrl = await uploadQuestionImage(studentId, imageFile);
        } catch {
          throw new Error("이미지 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.");
        }
      }

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayKst(), content: trimmed || "(이미지 질문)", imageUrl }),
      });
      if (!res.ok) throw new Error("질문 전송에 실패했어요.");

      const data = (await res.json()) as {
        question: {
          id: string;
          content: string;
          imageUrl: string | null;
          aiAnswer: string | null;
          createdAt: string;
        };
      };
      const q = data.question;

      setMessages((prev) => [
        ...prev,
        {
          id: q.id,
          sender: "me",
          body: q.content,
          imageUrl: q.imageUrl,
          tokenCost: 0,
          date: null,
          createdAt: q.createdAt,
        },
        // AI 미활성 시 서버가 즉시 붙여 준 모의 AI 답변을 타임라인에 반영.
        ...(q.aiAnswer
          ? [
              {
                id: `ai-mock-${q.id}`,
                sender: "ai" as const,
                body: q.aiAnswer,
                imageUrl: null,
                tokenCost: 0,
                date: null,
                createdAt: new Date().toISOString(),
              },
            ]
          : []),
      ]);

      setText("");
      setImageFile(null);

      // AI 활성 상태면 비동기로 AI 즉답을 요청해 타임라인에 이어 붙인다.
      if (aiAnswerEnabled && !q.aiAnswer) {
        void requestAiAnswer(q.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "질문 전송에 실패했어요.");
    } finally {
      setSending(false);
    }
  }

  const canSend = (text.trim().length > 0 || imageFile !== null) && !sending;

  return (
    <section className="page on" id="pg-questions" data-screen-label="질문">
      <div className="crumb">/questions</div>
      <h1>질문</h1>
      <p className="sub">
        사진과 함께 질문하면 AI가 먼저 풀이를 안내하고, 선생님이 이어서 확인해 드려요.
      </p>

      <div className="card sec" style={{ overflow: "hidden" }}>
        <div className="chat">
          <div className="chat-head">
            <div className="av" aria-hidden>
              💬
            </div>
            <div>
              <b>내 질문</b>
              <p>질문하면 AI가 먼저 답하고, 선생님이 이어서 확인해요.</p>
            </div>
          </div>

          <div className="chat-scroll" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="empty">
                <b>첫 질문을 남겨보세요</b>
                <p>모르는 문제를 내면 AI가 먼저 즉답하고, 선생님이 이어서 확인해 드려요.</p>
              </div>
            ) : (
              messages.map((m) => (
                <MsgBubble
                  key={m.id}
                  msg={m}
                  studentName={studentName}
                  onOpenImage={setLightbox}
                />
              ))
            )}
          </div>

          {error && (
            <div className="chat-note">
              <p style={{ color: "#A93636" }} role="alert">
                {error}
              </p>
            </div>
          )}

          <div className="composer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif,.heic"
              className="hidden"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            {previewUrl ? (
              <div className="cpv">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="첨부 미리보기" />
                <button
                  type="button"
                  className="rm"
                  aria-label="이미지 제거"
                  onClick={() => setImageFile(null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="attach"
                aria-label="이미지 첨부"
                disabled={sending}
                onClick={() => fileInputRef.current?.click()}
              >
                +
              </button>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="메시지 입력…"
              rows={1}
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <button
              type="button"
              className="send"
              aria-label="전송"
              disabled={!canSend}
              onClick={() => void handleSend()}
            >
              {sending ? "…" : "↑"}
            </button>
          </div>
        </div>
      </div>

      {lightbox && (
        <ImageLightbox
          src={lightbox}
          alt="질문 첨부 이미지"
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}
