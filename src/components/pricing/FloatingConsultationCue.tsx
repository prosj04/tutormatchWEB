"use client";

import Link from "next/link";

import { CONSULTATION_HREF } from "@/lib/pricing-plans";

type FloatingConsultationCueProps = {
  /** 있으면 같은 페이지 섹션으로 스크롤 */
  scrollTargetId?: string;
  className?: string;
};

export function FloatingConsultationCue({ scrollTargetId, className = "" }: FloatingConsultationCueProps) {
  const label = "상담 먼저 신청하기";

  const textClass =
    "cursor-pointer border-0 bg-transparent p-0 text-sm font-black tracking-[0.12em] text-neutral-40 underline-offset-[6px] transition hover:text-primary hover:underline md:text-base";

  const wrapClass = `flex justify-center ${className}`;

  if (scrollTargetId) {
    return (
      <div className={wrapClass}>
        <button
          type="button"
          onClick={() => {
            document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className={textClass}
        >
          {label}
        </button>
      </div>
    );
  }

  return (
    <div className={wrapClass}>
      <Link href={CONSULTATION_HREF} className={textClass}>
        {label}
      </Link>
    </div>
  );
}
