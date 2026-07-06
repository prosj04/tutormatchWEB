"use client";

import { useEffect, useState } from "react";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";

const SHOW_AFTER_PX = 300;

/**
 * 전 페이지 하단 중앙 고정 CTA (설탭 스타일).
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
      <div className="sticky-cta-bubble">첫 수업 후 불만족 시 100% 환불</div>
      <ConsultationApplyButton
        className="sticky-cta-btn"
        source="sticky_bottom_cta"
        tabIndex={visible ? 0 : -1}
      >
        딱 맞는 선생님 추천받기
      </ConsultationApplyButton>
    </div>
  );
}
