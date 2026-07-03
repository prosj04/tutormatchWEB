"use client";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { ConcordReveal } from "@/components/concord/ConcordReveal";

type ConcordSubpageCtaProps = {
  title?: string;
  description?: string;
  buttonLabel?: string;
  source?: string;
};

/** 서브페이지 하단 상담 유도 밴드. concord.css의 기존 sec/wrap/card/btn 클래스만 사용. */
export function ConcordSubpageCta({
  title = "지금 무료 상담으로 시작해 보세요",
  description = "학년·과목·목표만 알려주시면 매니저가 하루 안에 맞춤 플랜을 제안합니다.",
  buttonLabel = "무료 상담 신청",
  source = "subpage_cta",
}: ConcordSubpageCtaProps) {
  return (
    <section className="sec-sm">
      <div className="wrap">
        <ConcordReveal
          className="card"
          style={{
            textAlign: "center",
            padding: "clamp(28px, 4vw, 44px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: "clamp(20px, 2.4vw, 26px)", lineHeight: 1.3 }}>
            {title}
          </h2>
          {description ? (
            <p style={{ margin: 0, color: "var(--mut-2)", fontSize: 15, maxWidth: 560 }}>
              {description}
            </p>
          ) : null}
          <ConsultationApplyButton className="btn btn-acc btn-lg" source={source}>
            {buttonLabel}
          </ConsultationApplyButton>
        </ConcordReveal>
      </div>
    </section>
  );
}
