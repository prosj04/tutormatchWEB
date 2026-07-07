"use client";

import type { ReactNode } from "react";

import { addKakaoChannel, openKakaoChannelChat } from "@/lib/kakao-channel";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { trackEvent } from "@/lib/analytics-client";

function KakaoTalkIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.75 3 2.5 6.36 2.5 10.5c0 2.64 1.73 4.96 4.35 6.29-.14.5-.52 1.87-.6 2.16-.1.37.13.37.28.27.12-.08 1.9-1.29 2.67-1.82.9.13 1.83.2 2.8.2 5.25 0 9.5-3.36 9.5-7.5S17.25 3 12 3z" />
    </svg>
  );
}

type KakaoConsultButtonProps = {
  /** chat: 1:1 상담 채팅(기본) · add: 채널 추가 */
  variant?: "chat" | "add";
  className?: string;
  /** 애널리틱스 소스 태그 (기존 상담 CTA source 관례를 따른다) */
  source?: string;
  tabIndex?: number;
  children?: ReactNode;
};

/**
 * 카카오톡 채널 상담 버튼. 기본 스타일은 globals.css의 .kakao-btn
 * (카카오 브랜드 컬러 고정 — 테마와 무관).
 */
export function KakaoConsultButton({
  variant = "chat",
  className = "kakao-btn",
  source = "unknown",
  tabIndex,
  children,
}: KakaoConsultButtonProps) {
  const handleClick = () => {
    trackEvent(ANALYTICS_EVENTS.landingConsultationCtaClicked, {
      source,
      channel: "kakao",
      kakaoAction: variant,
    });
    if (variant === "add") void addKakaoChannel();
    else void openKakaoChannelChat();
  };

  return (
    <button type="button" className={className} onClick={handleClick} tabIndex={tabIndex}>
      <KakaoTalkIcon />
      {children ?? (variant === "add" ? "카카오톡 채널 추가" : "카카오톡으로 상담하기")}
    </button>
  );
}
