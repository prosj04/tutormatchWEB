"use client";

import { useEffect, useRef, useState } from "react";

export type SafetyStoryData = {
  intro: string;
  closer: string;
  pivot: string;
  matches: string[];
  steps: { title: string; desc: string }[];
};

const UNIT_VH = 40;

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * 스크롤 연동 스토리텔링: 핀 고정 화면에서 스크롤이 단계를 넘기고,
 * 모션 자체는 CSS 이징(스르륵)이 담당. 잠금·자동재생 없음.
 * 단계: intro → 매칭 3쌍 누적 → 클로저 → 전환(멈춤, 피벗 카피만).
 * 핀이 끝난 뒤 별도 화면에서 절차 01·02가 스크롤로 순차 등장.
 */
// 다크 구간 자동 진행: 검정 전환(첫 매칭) 시작~다크 마지막 단계(클로저) 도달까지 스스로 넘긴다.
const AUTO_STEP_MS = 1000; // 자동 전진 간격(데스크톱 기본)
const AUTO_STEP_MS_TOUCH = 1400; // 모바일/터치: 매칭 문구가 2~3줄 래핑되므로 읽을 시간 확보
const DARK_START = 1; // unit 1(첫 매칭)부터 검정

const STEP_VH = 55; // 절차 01·02 별도 화면의 스크롤 길이 단위

export function HomeSafetyStory({ data }: { data: SafetyStoryData }) {
  const pinRef = useRef<HTMLDivElement | null>(null);
  const stepsPinRef = useRef<HTMLDivElement | null>(null);
  const [unit, setUnit] = useState(0); // 0..totalUnits 연속값의 floor
  const [stepsOn, setStepsOn] = useState(0); // 절차 01·02 스크롤 누적 등장
  const [reduced, setReduced] = useState(false);
  const [autoStepMs, setAutoStepMs] = useState(AUTO_STEP_MS);
  const pivotSteps = data.steps.slice(0, 2); // 01·02 (절차)

  const matchCount = data.matches.length;
  const totalUnits = 1 + matchCount + 1 + 1; // intro + matches + closer + pivot
  const pivotText = data.pivot.replace(/\n/g, " ").trim();

  // 다크 구간 경계: unit 1(첫 매칭)~matchCount+1(클로저)이 검정. matchCount+1이 다크 마지막(=흰 전환 직전).
  const darkLast = matchCount + 1;

  // 스크롤이 다크 구간 안에 있는지(자동 진행 트리거 조건)와, 스크롤 기반 unit을 참조로 유지
  const scrollUnitRef = useRef(0);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollYRef = useRef(0);
  const lastManualAdvanceRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }
    let raf = 0;
    const clearAuto = () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const pin = pinRef.current;
        if (pin) {
          // 주소창 수축과 무관한 안정 기준: 100svh로 고정된 스테이지 높이 사용
          const stage = pin.querySelector<HTMLElement>(".lp2-story-stagevp");
          const vh = stage?.offsetHeight ?? window.innerHeight;
          const rect = pin.getBoundingClientRect();
          const total = pin.offsetHeight - vh;
          const progress = total > 0 ? clamp01(-rect.top / total) : 0;
          // 클로저·피벗(큰 카피 2장)은 가중치 2.5 — 스크롤을 더 오래 머물게 해 강조
          const weights = [1, ...Array<number>(matchCount).fill(1), 2.5, 2.5];
          const totalWeight = weights.reduce((a, b) => a + b, 0);
          const pr = progress * totalWeight;
          let su = totalUnits - 1;
          let acc = 0;
          for (let i = 0; i < weights.length; i++) {
            acc += weights[i];
            if (pr < acc) {
              su = i;
              break;
            }
          }
          scrollUnitRef.current = su;
          const y = window.scrollY;
          const dy = y - lastScrollYRef.current;
          lastScrollYRef.current = y;
          // 다크 구간: 사례는 반드시 1번부터, 한 번에 한 단계씩만 (스크롤 점프·자동재생 중복 방지).
          // 다크 구간 밖은 스크롤 상태로 동기화.
          setUnit((prev) => {
            const inDark = su >= DARK_START && su <= darkLast;
            if (!inDark) {
              clearAuto();
              return su;
            }
            // 위에서 진입: 스크롤이 얼마나 깊든 항상 첫 사례부터 시작 (진입 틱에는 전진 금지)
            const justEntered = !(prev >= DARK_START && prev <= darkLast + 1);
            let next = justEntered ? DARK_START : prev;
            const now = Date.now();
            if (justEntered) {
              lastManualAdvanceRef.current = now;
            } else if (dy > 4 && next >= DARK_START && next <= darkLast) {
              // 큰 카피(클로저·피벗)로 넘어가는 스텝은 더 길게 잡아 강조
              const gate = next + 1 >= darkLast ? 1800 : 700;
              if (now - lastManualAdvanceRef.current > gate) {
                lastManualAdvanceRef.current = now;
                next = Math.min(next + 1, darkLast + 1);
              }
            }
            return next;
          });
        }
        // 절차 01·02 별도 화면: 핀이 끝난 뒤 스크롤 진행에 따라 하나씩 누적 등장
        const stepsPin = stepsPinRef.current;
        if (stepsPin) {
          const stage = stepsPin.querySelector<HTMLElement>(".lp2-story-steps-vp");
          const vh = stage?.offsetHeight ?? window.innerHeight;
          const rect = stepsPin.getBoundingClientRect();
          const total = stepsPin.offsetHeight - vh;
          const progress = total > 0 ? clamp01(-rect.top / total) : 0;
          const n = pivotSteps.length;
          setStepsOn(Math.min(n, Math.floor(progress * (n + 0.6) + 0.45)));
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
      clearAuto();
    };
  }, [totalUnits, darkLast, matchCount, pivotSteps.length]);

  // 자동 전진 간격을 뷰포트 기준 차등: hover 없는 기기 또는 화면폭 ≤640px이면 느리게(1400ms).
  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (max-width: 640px)");
    const apply = () => setAutoStepMs(mq.matches ? AUTO_STEP_MS_TOUCH : AUTO_STEP_MS);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // 다크 구간 자동 진행: 다크 구간에 들어오면 타이머로 다음 단계로 — 흰 화면(darkLast+1)까지 전진 후 정지.
  useEffect(() => {
    if (reduced) return;
    const inDark = unit >= DARK_START && unit <= darkLast;
    if (!inDark) return;
    // 스크롤이 섹션 앞(인트로 이전)으로 돌아갔으면 자동 진행하지 않음
    const su = scrollUnitRef.current;
    if (su < DARK_START) return;
    autoTimerRef.current = setTimeout(() => {
      autoTimerRef.current = null;
      setUnit((prev) => (prev >= DARK_START && prev <= darkLast ? prev + 1 : prev));
    }, autoStepMs);
    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [unit, reduced, darkLast, autoStepMs]);

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
        <ol className="lp2-story-steps lp2-story-pivot-steps">
          {pivotSteps.map((s, i) => (
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
      {/* 클로저·피벗 가중치(+1.5×2)만큼 스크롤 길이 확장 */}
      <div ref={pinRef} className="lp2-story-pin" style={{ height: `${(totalUnits + 3) * UNIT_VH + 100}svh` }}>
        <div className={`lp2-story-stagevp${isDark ? " is-dark" : ""}`}>
          {/* 인트로 */}
          <div className={`lp2-story-item lp2-story-intro${phase === "intro" ? " is-active" : " is-passed"}`}>
            <h2>{data.intro}</h2>
          </div>

          {/* 매칭 3쌍 — 스크롤/자동전진에 따라 하나씩 아래로 누적(쌓임) */}
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

          {/* 전환 — 피벗 카피만 (절차 01·02는 핀 다음 별도 화면) */}
          <div className={`lp2-story-item lp2-story-pivot${phase === "pivot" ? " is-active" : ""}`}>
            <h2>{pivotText}</h2>
          </div>
        </div>
      </div>

      {/* 절차 01·02 — 핀(피벗)이 끝난 뒤 한 화면 넘겨야 나오는 별도 화면, 스크롤로 순차 등장 */}
      {pivotSteps.length > 0 && (
        <div
          ref={stepsPinRef}
          className="lp2-story-steps-pin"
          style={{ height: `${pivotSteps.length * STEP_VH + 130}svh` }}
        >
          <div className="lp2-story-steps-vp">
            <ol className="lp2-story-steps lp2-story-pivot-steps">
              {pivotSteps.map((s, i) => (
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
      )}
    </section>
  );
}
