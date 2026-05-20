"use client";

import { ConsultationSignupForm } from "@/components/auth/ConsultationSignupForm";

/** 레거시 전용 페이지용 — 일반적으로 모달을 사용합니다. */
export function RegisterForm() {
  return (
    <div className="pb-24 md:pb-32">
      <div className="border-b border-gray-100 bg-background py-12 md:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Consultation</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-text-primary sm:mt-4 sm:text-4xl md:text-5xl lg:text-6xl">상담 신청</h1>
        </div>
      </div>
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-14 md:px-8 md:py-20 lg:py-24">
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8 lg:p-10">
          <ConsultationSignupForm showLoginLink />
        </article>
      </div>
    </div>
  );
}
