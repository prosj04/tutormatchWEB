"use client";

import { useRef, useState } from "react";

import type { LandingView } from "./landing-view";
import { careMocks } from "./mocks";
import { makeRowHoverMove, useMobileCenterActive } from "./useLandingInteractions";

/**
 * 학습 관리 — 리포트 3종 + 숙제·질문 관리를 한 섹션으로 통합(오너 지시).
 * CMS가 라벨을 재정의할 수 있어 라벨 키워드로 목업을 매칭하고, 같은 라벨은 1회만 노출한다.
 * 목업 인덱스: 0 수업 리포트 · 1 월간 리포트 · 2 학부모 페이지 · 3 숙제 · 4 질문
 */
function pickCareMock(label: string, fallback: number) {
  return label.includes("숙제")
    ? 3
    : label.includes("질문")
      ? 4
      : label.includes("월간")
        ? 1
        : label.includes("학부모") || label.includes("진도")
          ? 2
          : label.includes("리포트")
            ? 1
            : fallback;
}

/** 오너 확정: 학생 루틴 축 — 숙제 → 질문 → 진도 → 리포트 순 */
const careRank: Record<number, number> = { 3: 0, 4: 1, 2: 2, 1: 3, 0: 4 };

export function CareEditorial({ view }: { view: LandingView }) {
  const { managementItems, lessonCareItems, kickers, sectionTitles } = view;
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  useMobileCenterActive(listRef, setActive);

  const seen = new Set<string>();
  const rows = [
    ...managementItems.map((it) => ({
      key: `m${it.n}`,
      label: it.label,
      desc: it.desc,
      mock: pickCareMock(it.label, it.n - 1),
    })),
    ...lessonCareItems.map((it) => ({
      key: `l${it.n}`,
      label: it.label,
      desc: it.desc,
      mock: pickCareMock(it.label, 2 + it.n),
    })),
  ]
    .filter((r) => (seen.has(r.label) ? false : (seen.add(r.label), true)))
    .sort((a, b) => (careRank[a.mock] ?? 9) - (careRank[b.mock] ?? 9));

  const mock = careMocks[rows[active]?.mock ?? 0];

  return (
    <section
      id="management"
      className="sec ruled"
      onMouseMove={makeRowHoverMove(setActive, undefined, listRef)}
    >
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow reveal lx-fast">{kickers.management}</span>
          <div className="sec-head-body">
            <h2 className="h2 reveal lx-slow" style={{ whiteSpace: "pre-line" }}>
              {sectionTitles.management}
            </h2>
            <p className="lede reveal lx-fast">{sectionTitles.managementSubtext}</p>
          </div>
        </div>

        <div className="lx-split">
          <div className="lx-led" ref={listRef}>
            {rows.map((item, index) => (
              <div
                key={item.key}
                className={`lx-led-row reveal lx-stag lx-fast${active === index ? " is-on" : ""}`}
                style={{ "--lx-i": index } as React.CSSProperties}
                onMouseEnter={() => setActive(index)}
              >
                <span className="idx">{`0${index + 1}`}</span>
                <div>
                  <h3>{item.label}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lx-mock lx-desktop-only" aria-hidden="true">
            <div className="lx-mock-view" key={`care-${active}`}>
              {mock}
            </div>
          </div>
        </div>

        <div className="lx-mock lx-mobile-only" aria-hidden="true" style={{ marginTop: 28 }}>
          <div className="lx-mock-view" key={`care-m-${active}`}>
            {mock}
          </div>
        </div>
      </div>
    </section>
  );
}
