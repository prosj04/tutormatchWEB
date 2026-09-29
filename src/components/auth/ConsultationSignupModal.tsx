"use client";

import { useEffect } from "react";

import { ConsultationSignupForm } from "@/components/auth/ConsultationSignupForm";

type ConsultationSignupModalProps = {
  open: boolean;
  onClose: () => void;
  instantEnroll?: boolean;
  copy?: Record<string, string>;
};

export function ConsultationSignupModal({
  open,
  onClose,
  instantEnroll = false,
  copy,
}: ConsultationSignupModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="scrim on">
      <button
        type="button"
        aria-label="닫기"
        className="cv-modal-backdrop"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultation-signup-title"
        className="modal cv-modal"
      >
        <button type="button" onClick={onClose} className="x cv-modal-x" aria-label="닫기">
          <span aria-hidden>×</span>
        </button>
        <div className="m-b">
          <ConsultationSignupForm onSuccess={onClose} instantEnroll={instantEnroll} copy={copy} />
        </div>
      </div>
    </div>
  );
}
