"use client";

import Link from "next/link";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import type { LandingView } from "./landing-view";

/** 최종 CTA — 풀블리드 .cta-band (세리프 h2 + 리드 + 각주 + .btn-on-acc) */
export function CtaEditorial({ view }: { view: LandingView }) {
  const { getCmsValue } = view;

  return (
    <section className="cta-band">
      <div className="wrap">
        <div className="lx-cta-inner">
          <h2 className="reveal lx-slow" style={{ whiteSpace: "pre-line" }}>
            {getCmsValue("cta", "headline", "판단은 첫 수업을 보고 하셔도 괜찮아요")}
          </h2>
          <p className="reveal lx-fast">
            {getCmsValue("cta", "subtext", "첫 수업이 맞지 않으면 100% 환불해 드립니다.")}
          </p>
          <Link href="/refund" className="footnote reveal lx-fast">
            *환불정책 참고
          </Link>
          <div className="reveal lx-fast">
            <ConsultationApplyButton className="btn btn-on-acc btn-lg" source="home_cta_band">
              {getCmsValue("cta", "button", "지금 무료 상담 신청하기")}
            </ConsultationApplyButton>
          </div>
        </div>
      </div>
    </section>
  );
}
