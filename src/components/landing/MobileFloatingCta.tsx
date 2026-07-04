"use client";

import { useEffect, useState } from "react";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";

const SHOW_AFTER_PX = 560;

/**
 * 모바일 전용 하단 고정 CTA.
 * 스크롤 560px 이상에서만 슬라이드업으로 나타남.
 * 680px 초과 뷰포트에서는 CSS로 숨김.
 */
export function MobileFloatingCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`lp2-float-cta${visible ? " is-visible" : ""}`}
      data-visible={visible ? "true" : "false"}
    >
      <div className="lp2-float-note">첫 수업 100% 환불 · 상담 신청 30초</div>
      <ConsultationApplyButton
        className="lp2-btn lp2-btn-acc"
        source="landing_float_cta"
        tabIndex={visible ? 0 : -1}
      >
        무료 상담 신청 <span aria-hidden="true">→</span>
      </ConsultationApplyButton>
    </div>
  );
}
