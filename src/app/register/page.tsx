"use client";

import { useEffect } from "react";
import Link from "next/link";

import { useConsultationSignup } from "@/components/providers/ConsultationSignupProvider";

export default function RegisterPage() {
  const { open } = useConsultationSignup();

  useEffect(() => {
    open();
  }, [open]);

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-neutral-20 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-black text-neutral-100">회원가입</h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-80">
          회원가입/상담 신청 창을 열고 있어요. 창이 보이지 않으면 아래 버튼을 눌러 다시 열어주세요.
        </p>
        <button
          type="button"
          onClick={open}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white transition hover:bg-primary/90"
        >
          회원가입/상담 신청 열기
        </button>
        <Link
          href="/"
          className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-neutral-20 bg-white px-6 py-3 text-sm font-black text-neutral-100 transition hover:bg-neutral-10"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
