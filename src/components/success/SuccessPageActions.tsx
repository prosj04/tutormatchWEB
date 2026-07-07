"use client";

import Link from "next/link";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { KakaoConsultButton } from "@/components/consultation/KakaoConsultButton";

type SuccessPageActionsProps = {
  homeLabel: string;
  consultationLabel: string;
};

export function SuccessPageActions({ homeLabel, consultationLabel }: SuccessPageActionsProps) {
  return (
    <div className="mt-10 flex w-full max-w-sm flex-col items-stretch gap-3 sm:mx-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4">
      <Link
        href="/"
        className="inline-flex w-full items-center justify-center rounded-2xl border border-gray-300 py-3.5 text-sm font-semibold uppercase tracking-wider text-text-primary transition hover:bg-gray-50 sm:w-auto sm:min-w-[180px]"
      >
        {homeLabel}
      </Link>
      <ConsultationApplyButton className="inline-flex w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-primary/90 sm:w-auto sm:min-w-[180px]">
        {consultationLabel}
      </ConsultationApplyButton>
      <KakaoConsultButton
        variant="add"
        source="success_page"
        className="kakao-btn w-full !rounded-2xl sm:w-auto sm:min-w-[180px]"
      >
        카카오톡 채널 추가하고 소식 받기
      </KakaoConsultButton>
    </div>
  );
}
