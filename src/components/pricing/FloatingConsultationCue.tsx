"use client";

import { useEffect, useRef, useState } from "react";

import { useConsultationCta } from "@/hooks/useConsultationCta";

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
  scrollTargetId?: string;
  className?: string;
  label?: string;
  showChevron?: boolean;
  /** 스크롤 시 페이드·슬라이드 등장 */
  revealOnScroll?: boolean;
  /** 외부에서 표시 여부 제어 (고정 플로팅 등) */
  visible?: boolean;
};

export function FloatingConsultationCue({
  scrollTargetId,
  className = "",
  label = "상담 먼저 신청하기",
  showChevron = false,
  revealOnScroll = false,
  visible = true,
}: FloatingConsultationCueProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(!revealOnScroll);
  const goConsultation = useConsultationCta();

  useEffect(() => {
    if (!revealOnScroll || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRevealed(true);
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [revealOnScroll]);

  const textClass =
    "cursor-pointer border-0 bg-transparent p-0 text-sm font-black tracking-[0.12em] text-neutral-40 transition hover:text-primary md:text-base";

  const scrollToTarget = () => {
    if (scrollTargetId) {
      document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const isShown = visible && revealed;

  const content = scrollTargetId ? (
    <button type="button" onClick={scrollToTarget} className={`flex flex-col items-center ${textClass}`}>
      <span>{label}</span>
      {showChevron ? <ScrollChevron /> : null}
    </button>
  ) : (
    <button type="button" onClick={() => void goConsultation()} className={`flex flex-col items-center ${textClass}`}>
      <span>{label}</span>
      {showChevron ? <ScrollChevron /> : null}
    </button>
  );

  return (
    <div
      ref={ref}
      className={`flex justify-center transition duration-700 ease-out ${
        isShown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {content}
    </div>
  );
}
