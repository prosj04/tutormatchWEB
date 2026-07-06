"use client";

import { useEffect, useRef, useState } from "react";

export type SafetyStoryData = {
  intro: string;
  closer: string;
  pivot: string;
  matches: string[];
  steps: { title: string; desc: string }[];
};

const STEP_VH = 50;
const SEEN_KEY = "concord_story_seen";

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * 시퀀스: intro(스크롤 트리거) → [자동: 매칭 4쌍 누적 → 클로저] → 전환(멈춤, 스크롤 재개)
 * 재생 중 스크롤 잠금 + 스크롤/클릭/키 입력 시 다음 단계로 스킵. 세션당 1회만 재생.
 */
export function HomeSafetyStory({ data }: { data: SafetyStoryData }) {
  const pinRef = useRef<HTMLDivElement | null>(null);
  const stepsPinRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const milestoneRef = useRef(0);
  const runNextRef = useRef<() => void>(() => {});
  const [matchShown, setMatchShown] = useState(0);
  const [phase, setPhase] = useState<"intro" | "match" | "closer" | "pivot">("intro");
  const [stepsOn, setStepsOn] = useState(0);
  const [staticMode, setStaticMode] = useState(false);

  const pivotText = data.pivot.replace(/\n/g, " ").trim();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    if (reduced || seen) {
      setStaticMode(true);
      return;
    }

    const lock = () => {
      document.documentElement.style.overflow = "hidden";
    };
    const unlock = () => {
      document.documentElement.style.overflow = "";
    };

    // 마일스톤: [지연ms, 실행fn] — 실행 후 다음 마일스톤을 예약. 스킵 시 즉시 다음 실행.
    const milestones: [number, () => void][] = [
      ...data.matches.map((_, i) => [i === 0 ? 350 : 1200, () => setMatchShown(i + 1)] as [number, () => void]),
      [1600, () => setPhase("closer")],
      [
        1700,
        () => {
          setPhase("pivot");
          unlock();
          try {
            window.sessionStorage.setItem(SEEN_KEY, "1");
          } catch {
            /* storage 불가 환경 무시 */
          }
        },
      ],
    ];

    const scheduleNext = () => {
      const idx = milestoneRef.current;
      if (idx >= milestones.length) return;
      timerRef.current = window.setTimeout(() => runNextRef.current(), milestones[idx][0]);
    };
    runNextRef.current = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const idx = milestoneRef.current;
      if (idx >= milestones.length) return;
      milestoneRef.current = idx + 1;
      milestones[idx][1]();
      scheduleNext();
    };

    const startSequence = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      lock();
      setPhase("match");
      scheduleNext();
    };

    // 잠금 중 입력 → 다음 단계로 스킵
    const skip = (e: Event) => {
      if (!startedRef.current || milestoneRef.current >= milestones.length) return;
      e.preventDefault();
      runNextRef.current();
    };
    const keySkip = (e: KeyboardEvent) => {
      if ([" ", "ArrowDown", "PageDown", "Enter"].includes(e.key)) skip(e);
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        const pin = pinRef.current;
        if (pin && !startedRef.current) {
          const rect = pin.getBoundingClientRect();
          const total = pin.offsetHeight - vh;
          const progress = total > 0 ? clamp01(-rect.top / total) : 0;
          if (progress > 0.3) startSequence();
        }
        const sp = stepsPinRef.current;
        if (sp) {
          const rect = sp.getBoundingClientRect();
          const total = sp.offsetHeight - vh;
          const progress = total > 0 ? clamp01(-rect.top / total) : 0;
          setStepsOn(Math.min(data.steps.length, Math.floor(progress * (data.steps.length + 0.6) + 0.45)));
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("wheel", skip, { passive: false });
    window.addEventListener("touchmove", skip, { passive: false });
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", keySkip);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", keySkip);
      if (raf) cancelAnimationFrame(raf);
      if (timerRef.current) clearTimeout(timerRef.current);
      unlock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.matches.length, data.steps.length]);

  const isDark = phase === "match" || phase === "closer";

  // 다크 구간: 네비게이션·배너까지 검게, 하단 상담 버튼은 잠시 숨김
  useEffect(() => {
    document.body.classList.toggle("story-dark", isDark && !staticMode);
    return () => document.body.classList.remove("story-dark");
  }, [isDark, staticMode]);

  if (staticMode) {
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
      <div ref={pinRef} className="lp2-story-pin" style={{ height: "240vh" }}>
        <div className={`lp2-story-stagevp${isDark ? " is-dark" : ""}`}>
          {/* 인트로 */}
          <div className={`lp2-story-item lp2-story-intro${phase === "intro" ? " is-active" : " is-passed"}`}>
            <h2>{data.intro}</h2>
          </div>

          {/* 매칭 4쌍 — 자동으로 하나씩 아래로 붙음 */}
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

          {/* 전환 — 나오고 멈춤, 여기서부터 스크롤 재개 */}
          <div className={`lp2-story-item lp2-story-pivot${phase === "pivot" ? " is-active" : ""}`}>
            <h2>{pivotText}</h2>
          </div>
        </div>
      </div>

      {/* 절차 5단계 — 스크롤에 따라 하나씩 누적 */}
      <div
        ref={stepsPinRef}
        className="lp2-story-steps-pin"
        style={{ height: `${data.steps.length * STEP_VH + 130}vh` }}
      >
        <div className="lp2-story-steps-vp">
          <ol className="lp2-story-steps">
            {data.steps.map((s, i) => (
              <li key={s.title} className={`lp2-story-step${i < stepsOn ? " on" : ""}`}>
                <span className="num">0{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p style={{ whiteSpace: "pre-line" }}>{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
