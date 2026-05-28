"use client";

import { useEffect } from "react";

import { ConsultationSignupForm } from "@/components/auth/ConsultationSignupForm";

type ConsultationSignupModalProps = {
  open: boolean;
  onClose: () => void;
  instantEnroll?: boolean;
};

export function ConsultationSignupModal({
  open,
  onClose,
  instantEnroll = false,
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
        className="absolute inset-0 bg-neutral-100 sm:bg-neutral-100/50 sm:backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultation-signup-title"
        className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-md overflow-y-auto rounded-[24px] border border-neutral-20 bg-white p-7 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-10 text-lg leading-none text-neutral-80 transition hover:bg-neutral-20 hover:text-neutral-100"
          aria-label="닫기"
        >
          ×
        </button>
        <ConsultationSignupForm onSuccess={onClose} instantEnroll={instantEnroll} />
      </div>
    </div>
  );
}
