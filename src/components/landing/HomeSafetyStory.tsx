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
// 다크 구간 자동 진행: 검정 전환(첫 매칭) 시작~다크 마지막 단계(클로저) 도달까지 스스로 넘긴다.
const AUTO_STEP_MS = 1000; // 자동 전진 간격
const DARK_START = 1; // unit 1(첫 매칭)부터 검정

export function HomeSafetyStory({ data }: { data: SafetyStoryData }) {
  const pinRef = useRef<HTMLDivElement | null>(null);
  const stepsPinRef = useRef<HTMLDivElement | null>(null);
  const [unit, setUnit] = useState(0); // 0..totalUnits 연속값의 floor
  const [stepsOn, setStepsOn] = useState(0);
  const [reduced, setReduced] = useState(false);

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
        const vh = window.innerHeight;
        const pin = pinRef.current;
        if (pin) {
          const rect = pin.getBoundingClientRect();
          const total = pin.offsetHeight - vh;
          const progress = total > 0 ? clamp01(-rect.top / total) : 0;
          // 클로저·피벗(큰 카피 2장)은 가중치 1.7 — 스크롤을 더 오래 머물게 해 강조
          const weights = [1, ...Array<number>(matchCount).fill(1), 1.7, 1.7];
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
              const gate = next + 1 >= darkLast ? 1200 : 700;
              if (now - lastManualAdvanceRef.current > gate) {
                lastManualAdvanceRef.current = now;
                next = Math.min(next + 1, darkLast + 1);
              }
            }
            return next;
          });
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
  }, [totalUnits, darkLast, matchCount]);

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
    }, AUTO_STEP_MS);
    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [unit, reduced, darkLast]);

  // 절차 5단계 등장 — 데스크톱: 섹션 진입 시 순차 재생 / 모바일: 각 단계가 뷰포트에 들어올 때 등장
  useEffect(() => {
    if (reduced) return;
    const sp = stepsPinRef.current;
    if (!sp) return;

    if (window.matchMedia("(max-width: 960px)").matches) {
      const items = Array.from(sp.querySelectorAll<HTMLElement>(".lp2-story-step"));
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const idx = items.indexOf(e.target as HTMLElement);
            setStepsOn((prev) => Math.max(prev, idx + 1));
            io.unobserve(e.target);
          });
        },
        { threshold: 0.25 },
      );
      items.forEach((el) => io.observe(el));
      return () => io.disconnect();
    }

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
  }, [reduced, data.steps]);

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
      {/* 클로저·피벗 가중치(+0.7×2)만큼 스크롤 길이 확장 */}
      <div ref={pinRef} className="lp2-story-pin" style={{ height: `${(totalUnits + 1.4) * UNIT_VH + 100}vh` }}>
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

      {/* 절차 단계 — 섹션 진입 시 자동 순차 등장. 3개 이상이면 좌(사전 검증)/우(사후 관리) 2단 배치 */}
      <div ref={stepsPinRef} className="lp2-story-steps-pin">
        <div className="lp2-story-steps-vp">
          <div className={`lp2-story-steps-cols${data.steps.length <= 2 ? " single" : ""}`}>
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
            {data.steps.length > 2 && (
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
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
