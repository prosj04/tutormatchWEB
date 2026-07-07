"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";

const SHOW_AFTER_PX = 300;

/**
 * 전 페이지 하단 고정 CTA 바 (수능선배 스타일 풀바).
 * 스크롤 300px 이후 표시, 푸터가 뷰포트에 들어오면 숨김.
 */
export function StickyConsultCta() {
  const [scrolled, setScrolled] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setFooterVisible(entry.isIntersecting));
      },
      { rootMargin: "0px 0px 40px 0px" },
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  const visible = scrolled && !footerVisible;

  return (
    <div className={`sticky-cta${visible ? " is-visible" : ""}`} aria-hidden={!visible}>
      <span className="sticky-cta-badge">모집중</span>
      <p className="sticky-cta-msg">
        이번 달 신규 상담이 얼마 남지 않았어요 · 첫 수업 후 불만족 시 100% 환불
      </p>
      <div className="sticky-cta-actions">
        <Link href="/tutors" className="sticky-cta-ghost" tabIndex={visible ? 0 : -1}>
          선생님 둘러보기
        </Link>
        <ConsultationApplyButton
          className="sticky-cta-btn"
          source="sticky_bottom_cta"
          tabIndex={visible ? 0 : -1}
        >
          딱 맞는 선생님 추천받기
        </ConsultationApplyButton>
      </div>
    </div>
  );
}
