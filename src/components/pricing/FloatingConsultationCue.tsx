"use client";

import Link from "next/link";

import { CONSULTATION_HREF } from "@/lib/pricing-plans";

function ScrollChevron({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="10"
      viewBox="0 0 14 10"
      fill="none"
      aria-hidden
      className={`mt-2 animate-bounce ${className}`}
    >
      <path
        d="M1 1.5L7 8.5L13 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type FloatingConsultationCueProps = {
  /** 있으면 같은 페이지 섹션으로 스크롤 */
  scrollTargetId?: string;
  className?: string;
  label?: string;
  showChevron?: boolean;
  /** 홈 우하단 고정 플로팅 */
  fixed?: boolean;
  visible?: boolean;
};

export function FloatingConsultationCue({
  scrollTargetId,
  className = "",
  label = "상담 먼저 신청하기",
  showChevron = false,
  fixed = false,
  visible = true,
}: FloatingConsultationCueProps) {
  const textClass = fixed
    ? "cursor-pointer border-0 bg-transparent p-0 text-sm font-black tracking-[0.1em] text-primary transition hover:text-primary/80 md:text-base"
    : "cursor-pointer border-0 bg-transparent p-0 text-sm font-black tracking-[0.12em] text-neutral-40 underline-offset-[6px] transition hover:text-primary hover:underline md:text-base";

  const scrollToTarget = () => {
    if (scrollTargetId) {
      document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const content = scrollTargetId ? (
    <button type="button" onClick={scrollToTarget} className={`flex flex-col items-center ${textClass}`}>
      <span>{label}</span>
      {showChevron ? <ScrollChevron /> : null}
    </button>
  ) : (
    <Link href={CONSULTATION_HREF} className={`flex flex-col items-center ${textClass}`}>
      <span>{label}</span>
      {showChevron ? <ScrollChevron /> : null}
    </Link>
  );

  if (fixed) {
    return (
      <div
        className={`fixed bottom-8 right-6 z-50 flex flex-col items-end transition duration-300 md:bottom-10 md:right-10 ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        } ${className}`}
      >
        {content}
      </div>
    );
  }

  return <div className={`flex justify-center ${className}`}>{content}</div>;
}
