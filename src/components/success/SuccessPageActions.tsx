"use client";

import Link from "next/link";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";

type SuccessPageActionsProps = {
  homeLabel: string;
  consultationLabel: string;
};

export function SuccessPageActions({ homeLabel, consultationLabel }: SuccessPageActionsProps) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
      <Link
        href="/"
        className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-gray-300 py-3.5 text-sm font-semibold uppercase tracking-wider text-text-primary transition hover:bg-gray-50"
      >
        {homeLabel}
      </Link>
      <ConsultationApplyButton className="inline-flex min-w-[200px] items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-primary/90">
        {consultationLabel}
      </ConsultationApplyButton>
    </div>
  );
}
