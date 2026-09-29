"use client";

import { useEffect, useRef, useState } from "react";

import { usePortalCopy } from "@/components/providers/PortalSiteContentProvider";

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
  const title = usePortalCopy("student_question_modal", "title", "질문 등록");
  const closeLabel = usePortalCopy("student_question_modal", "close", "닫기");
  const labelContent = usePortalCopy("student_question_modal", "label_content", "질문 내용");
  const placeholderContent = usePortalCopy(
    "student_question_modal",
    "placeholder_content",
    "질문 내용을 입력하세요",
  );
  const btnAttach = usePortalCopy("student_question_modal", "btn_attach", "이미지 첨부");
  const previewAlt = usePortalCopy("student_question_modal", "preview_alt", "미리보기");
  const btnRemoveImage = usePortalCopy("student_question_modal", "btn_remove_image", "이미지 제거");
  const errInvalidImage = usePortalCopy(
    "student_question_modal",
    "err_invalid_image",
    "JPEG, PNG, HEIC 형식만 업로드할 수 있습니다.",
  );
  const errEmpty = usePortalCopy("student_question_modal", "err_empty", "질문 내용을 입력해 주세요.");
  const errSubmit = usePortalCopy("student_question_modal", "err_submit", "질문 등록에 실패했습니다.");
  const btnSubmitting = usePortalCopy("student_question_modal", "btn_submitting", "등록 중…");
  const btnSubmit = usePortalCopy("student_question_modal", "btn_submit", "질문 등록");

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
      setError(errInvalidImage);
      return;
    }
    setError("");
    setImageFile(file);
  }

  async function handleSubmit() {
    if (!content.trim()) {
      setError(errEmpty);
      return;
    }
    setError("");
    try {
      await onSubmit(content.trim(), imageFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : errSubmit);
    }
  }

  if (!open) return null;

  return (
    <div className="scrim on">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-question-title">
        <div className="m-b">
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <h3 id="add-question-title">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn ghost sm"
              style={{ marginLeft: "auto" }}
            >
              {closeLabel}
            </button>
          </div>

          <div className="field" style={{ marginTop: "18px" }}>
            <label htmlFor="add-question-content">{labelContent}</label>
            <textarea
              id="add-question-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholderContent}
              rows={5}
              disabled={submitting}
              className="inp area"
            />
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif,.heic"
              className="hidden"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={submitting}
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-ghost btn-sm"
            >
              {btnAttach}
            </button>
            {previewUrl && (
              <div className="st-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt={previewAlt} />
                <button type="button" disabled={submitting} onClick={() => setImageFile(null)}>
                  {btnRemoveImage}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="banner err" style={{ marginTop: "16px" }} role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="m-f">
          <button type="button" disabled={submitting} onClick={handleSubmit} className="btn pri">
            {submitting ? btnSubmitting : btnSubmit}
          </button>
        </div>
      </div>
    </div>
  );
}
