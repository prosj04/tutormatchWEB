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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 border-0 bg-black/45 p-0 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultation-signup-title"
        className="concord-surface auth-card relative z-10 max-h-[min(94vh,880px)] w-full max-w-2xl overflow-y-auto p-6 sm:p-7"
        style={{ margin: 0, maxWidth: "min(640px, calc(100vw - 32px))" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="theme-toggle absolute right-4 top-4"
          aria-label="닫기"
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>×</span>
        </button>
        <ConsultationSignupForm onSuccess={onClose} instantEnroll={instantEnroll} copy={copy} />
      </div>
    </div>
  );
}
