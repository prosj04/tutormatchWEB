"use client";

import { useEffect, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

type AddQuestionModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string, imageFile: File | null) => Promise<void>;
  submitting: boolean;
};

export function AddQuestionModal({
  open,
  onClose,
  onSubmit,
  submitting,
}: AddQuestionModalProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setContent("");
      setImageFile(null);
      setPreviewUrl(null);
      setError("");
    }
  }, [open]);

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
      setError("JPEG, PNG, HEIC 형식만 업로드할 수 있습니다.");
      return;
    }
    setError("");
    setImageFile(file);
  }

  async function handleSubmit() {
    if (!content.trim()) {
      setError("질문 내용을 입력해 주세요.");
      return;
    }
    setError("");
    try {
      await onSubmit(content.trim(), imageFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "질문 등록에 실패했습니다.");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-question-title"
    >
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-card p-6 shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="add-question-title" className="text-lg font-bold text-text-dark">
            질문 등록
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-sm text-text-mid hover:text-text-dark disabled:opacity-50"
          >
            닫기
          </button>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-wider text-text-light">
          질문 내용
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="질문 내용을 입력하세요"
          rows={5}
          disabled={submitting}
          className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-dark outline-none focus:border-gold"
        />

        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/heif,.heic"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={submitting}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-dashed border-gray-200 px-4 py-2.5 text-sm font-medium text-text-mid hover:border-gold hover:text-gold disabled:opacity-50"
          >
            이미지 첨부
          </button>
          {previewUrl && (
            <div className="mt-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="미리보기"
                className="h-24 rounded-lg border border-gray-100 object-cover"
              />
              <button
                type="button"
                disabled={submitting}
                onClick={() => setImageFile(null)}
                className="mt-1 block text-xs text-text-light hover:text-accent"
              >
                이미지 제거
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-accent" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="mt-6 w-full rounded-xl bg-gold py-3.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "등록 중…" : "질문 등록"}
        </button>
      </div>
    </div>
  );
}
