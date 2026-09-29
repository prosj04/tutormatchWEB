"use client";

import Link from "next/link";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import type { LandingView } from "./landing-view";
import { useAccordion } from "./useLandingInteractions";

/** FAQ — 왼쪽 sec-head / 오른쪽 헤어라인 아코디언(기본 닫힘·외부 클릭 시 닫힘) + 기존 CTA 2개 */
export function FaqEditorial({
  view,
  faqs,
}: {
  view: LandingView;
  faqs: { q: string; a: string }[];
}) {
  const { getCmsValue, kickers, uiLabels } = view;
  const { open, toggle, rootRef } = useAccordion();
  const items = faqs.slice(0, 5);

  return (
    <section id="faq" className="sec ruled">
      <div className="wrap">
        <div className="lx-faq">
          <div className="lx-faq-head">
            <span className="eyebrow reveal lx-fast">{kickers.faq}</span>
            <h2 className="h2 reveal lx-slow" style={{ marginTop: 26 }}>
              {uiLabels.faqTitle}
            </h2>
          </div>

          <div className="lx-faq-body">
            <div className="lx-acc lx-acc-plain" ref={rootRef}>
              {items.map((item, index) => {
                const isOpen = open === index;
                return (
                  <div
                    key={`${index}-${item.q}`}
                    className="lx-acc-item reveal lx-stag lx-fast"
                    style={{ "--lx-i": index } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      className="lx-acc-btn"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${index}`}
                      onClick={() => toggle(index)}
                    >
                      <span className="lx-acc-t">{item.q}</span>
                      <span className="lx-ind" aria-hidden="true" />
                    </button>
                    <p id={`faq-panel-${index}`} className="lx-acc-p lx-acc-p-flush" hidden={!isOpen}>
                      {item.a}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="lx-faq-cta reveal lx-fast">
              <ConsultationApplyButton className="btn btn-acc" source="home_faq">
                {getCmsValue("faq", "consult_cta", "남은 궁금증은 상담으로 물어보세요")}
              </ConsultationApplyButton>
              <Link href="/faq" className="btn btn-text">
                {uiLabels.viewAllFaq}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
