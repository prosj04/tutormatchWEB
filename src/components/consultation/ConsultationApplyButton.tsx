"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { useConsultationCta } from "@/hooks/useConsultationCta";

type ConsultationApplyButtonProps = {
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick" | "children">;

/** 네비 「상담 신청」과 동일 동작의 버튼 (링크 대체용) */
export function ConsultationApplyButton({ children, className, ...rest }: ConsultationApplyButtonProps) {
  const go = useConsultationCta();
  return (
    <button type="button" onClick={() => void go()} className={className} {...rest}>
      {children}
    </button>
  );
}
