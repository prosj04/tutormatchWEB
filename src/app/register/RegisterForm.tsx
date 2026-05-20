"use client";

import { ConsultationSignupForm } from "@/components/auth/ConsultationSignupForm";

/** 레거시 전용 페이지용 — 일반적으로 모달을 사용합니다. */
export function RegisterForm() {
  return (
    <div className="pb-24 md:pb-32">
      <div className="border-b border-gray-100 bg-background py-24">
        <div className="mx-auto max-w-6xl px-8">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Consultation</p>
          <h1 className="mt-4 text-5xl font-black leading-tight text-text-primary sm:text-6xl">상담 신청</h1>
        </div>
      </div>
      <div className="mx-auto max-w-md px-8 py-16 md:py-24">
        <article className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:p-10">
          <ConsultationSignupForm showLoginLink />
        </article>
      </div>
    </div>
  );
}
