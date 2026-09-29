"use client";

import { useRef, useState } from "react";

import type { LandingView } from "./landing-view";
import { processMocks } from "./mocks";
import { makeRowHoverMove, useAccordion, useMobileCenterActive } from "./useLandingInteractions";

/**
 * 이렇게 진행됩니다 — 왼쪽 원장형 아코디언(기본 닫힘·외부 클릭 시 닫힘),
 * 오른쪽 목업은 스크롤을 따라다니지 않고 목록 기준 세로 중앙에 고정된다.
 * 활성 항목(호버·탭·모바일 중앙)이 바뀌면 목업 내용만 교체된다.
 */
export function ProcessEditorial({ view }: { view: LandingView }) {
  const { cmsSteps, kickers, sectionTitles } = view;
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const tapLockRef = useRef(0);
  const { open, toggle, rootRef } = useAccordion(tapLockRef);
  useMobileCenterActive(listRef, setActive, tapLockRef);

  const mock = processMocks[Math.min(active, processMocks.length - 1)];

  return (
    <section
      id="process"
      className="sec ruled"
      onMouseMove={makeRowHoverMove(setActive, tapLockRef, listRef)}
    >
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow reveal lx-fast">{kickers.process}</span>
          <div className="sec-head-body">
            <h2 className="h2 reveal lx-slow">{sectionTitles.process}</h2>
            <p className="lede reveal lx-fast">{sectionTitles.processSubtext}</p>
          </div>
        </div>

        <div className="lx-split">
          <div className="lx-acc" ref={rootRef}>
            <div ref={listRef}>
              {cmsSteps.map((step, index) => {
                const isOpen = open === index;
                return (
                  <div
                    key={step.number}
                    className={`lx-acc-item reveal lx-stag${active === index ? " is-on" : ""}`}
                    style={{ "--lx-i": index } as React.CSSProperties}
                    onMouseEnter={() => setActive(index)}
                  >
                    <button
                      type="button"
                      className="lx-acc-btn"
                      aria-expanded={isOpen}
                      aria-controls={`proc-panel-${step.number}`}
                      onClick={() => {
                        setActive(index);
                        toggle(index);
                      }}
                      onFocus={() => setActive(index)}
                    >
                      <span className="idx">{step.number}</span>
                      <span className="lx-acc-t">{step.title}</span>
                      <span className="lx-ind" aria-hidden="true" />
                    </button>
                    <p
                      id={`proc-panel-${step.number}`}
                      className="lx-acc-p"
                      hidden={!isOpen}
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lx-mock lx-desktop-only" aria-hidden="true">
            <div className="lx-mock-view" key={active}>
              {mock?.body}
            </div>
            {mock?.note ? <p className="lx-mock-note">{mock.note}</p> : null}
          </div>
        </div>

        <div className="lx-mock lx-mobile-only" aria-hidden="true" style={{ marginTop: 28 }}>
          <div className="lx-mock-view" key={`m-${active}`}>
            {mock?.body}
          </div>
          {mock?.note ? <p className="lx-mock-note">{mock.note}</p> : null}
        </div>
      </div>
    </section>
  );
}
