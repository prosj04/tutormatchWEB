"use client";

import { useEffect, useRef, useState } from "react";

export type SafetyStoryData = {
  intro: string;
  closer: string;
  pivot: string;
  matches: string[];
  steps: { title: string; desc: string }[];
};

const UNIT_VH = 55;

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * 스크롤 연동 스토리텔링: 핀 고정 화면에서 스크롤이 단계를 넘기고,
 * 모션 자체는 CSS 이징(스르륵)이 담당. 잠금·자동재생 없음.
 * 단계: intro → 매칭 4쌍 누적 → 클로저 → 전환(멈춤).
 */
export function HomeSafetyStory({ data }: { data: SafetyStoryData }) {
  const pinRef = useRef<HTMLDivElement | null>(null);
  const stepsPinRef = useRef<HTMLDivElement | null>(null);
  const [unit, setUnit] = useState(0); // 0..totalUnits 연속값의 floor
  const [stepsOn, setStepsOn] = useState(0);
  const [reduced, setReduced] = useState(false);

  const matchCount = data.matches.length;
  const totalUnits = 1 + matchCount + 1 + 1; // intro + matches + closer + pivot
  const pivotText = data.pivot.replace(/\n/g, " ").trim();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        const pin = pinRef.current;
        if (pin) {
          const rect = pin.getBoundingClientRect();
          const total = pin.offsetHeight - vh;
          const progress = total > 0 ? clamp01(-rect.top / total) : 0;
          setUnit(Math.min(totalUnits - 1, Math.floor(progress * totalUnits)));
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalUnits, data.steps.length]);

  // 절차 5단계: 섹션이 보이면 스크롤을 기다리지 않고 순차 등장 (1·2 → 3·4·5)
  useEffect(() => {
    if (reduced) return;
    const sp = stepsPinRef.current;
    if (!sp) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        timers = data.steps.map((_, i) =>
          setTimeout(() => setStepsOn(i + 1), 350 + i * 550),
        );
      },
      { threshold: 0.3 },
    );
    io.observe(sp);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [reduced, data.steps.length]);

  const phase: "intro" | "match" | "closer" | "pivot" =
    unit === 0 ? "intro" : unit <= matchCount ? "match" : unit === matchCount + 1 ? "closer" : "pivot";
  const matchShown = phase === "match" ? unit : phase === "intro" ? 0 : matchCount;
  const isDark = phase === "match" || phase === "closer";

  // 다크 구간: 네비게이션·배너까지 검게, 하단 상담 버튼은 잠시 숨김
  useEffect(() => {
    document.body.classList.toggle("story-dark", isDark && !reduced);
    return () => document.body.classList.remove("story-dark");
  }, [isDark, reduced]);

  if (reduced) {
    return (
      <section className="lp2-story lp2-story-static" aria-label="성향 맞춤 선생님 배정">
        <div className="lp2-story-sblock"><h2>{data.intro}</h2></div>
        <div className="lp2-story-sblock dark">
          {data.matches.map((m) => (
            <p key={m} className="lp2-story-matchline">{m}</p>
          ))}
        </div>
        <div className="lp2-story-sblock dark"><h2>{data.closer}</h2></div>
        <div className="lp2-story-sblock"><h2>{pivotText}</h2></div>
        <ol className="lp2-story-steps">
          {data.steps.map((s, i) => (
            <li key={s.title} className="lp2-story-step on">
              <span className="num">0{i + 1}</span>
              <div>
                <h3>{s.title}</h3>
                <p style={{ whiteSpace: "pre-line" }}>{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="lp2-story" aria-label="성향 맞춤 선생님 배정">
      <div ref={pinRef} className="lp2-story-pin" style={{ height: `${totalUnits * UNIT_VH + 100}vh` }}>
        <div className={`lp2-story-stagevp${isDark ? " is-dark" : ""}`}>
          {/* 인트로 */}
          <div className={`lp2-story-item lp2-story-intro${phase === "intro" ? " is-active" : " is-passed"}`}>
            <h2>{data.intro}</h2>
          </div>

          {/* 매칭 4쌍 — 스크롤에 따라 하나씩 아래로 붙음 */}
          <div
            className={`lp2-story-item lp2-story-newsstack${phase === "match" ? " is-active" : phase === "intro" ? "" : " is-passed"}`}
          >
            {data.matches.map((m, i) => (
              <p key={m} className={`lp2-story-matchline${i < matchShown ? " on" : ""}`}>{m}</p>
            ))}
          </div>

          {/* 클로저 */}
          <div
            className={`lp2-story-item lp2-story-closer${phase === "closer" ? " is-active" : phase === "pivot" ? " is-passed" : ""}`}
          >
            <h2>{data.closer}</h2>
          </div>

          {/* 전환 — 나오고 멈춤 */}
          <div className={`lp2-story-item lp2-story-pivot${phase === "pivot" ? " is-active" : ""}`}>
            <h2>{pivotText}</h2>
          </div>
        </div>
      </div>

      {/* 절차 5단계 — 섹션 진입 시 자동 순차 등장 */}
      <div ref={stepsPinRef} className="lp2-story-steps-pin">
        <div className="lp2-story-steps-vp">
          {/* 좌: 사전 검증(1·2, 강조) / 우: 사후 관리(3·4·5, 회색 번호) */}
          <div className="lp2-story-steps-cols">
            <ol className="lp2-story-steps pre">
              {data.steps.slice(0, 2).map((s, i) => (
                <li key={s.title} className={`lp2-story-step${i < stepsOn ? " on" : ""}`}>
                  <span className="num">0{i + 1}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p style={{ whiteSpace: "pre-line" }}>{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <ol className="lp2-story-steps post">
              {data.steps.slice(2).map((s, i) => (
                <li key={s.title} className={`lp2-story-step${i + 2 < stepsOn ? " on" : ""}`}>
                  <span className="num">0{i + 3}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p style={{ whiteSpace: "pre-line" }}>{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
