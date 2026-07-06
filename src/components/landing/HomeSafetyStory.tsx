"use client";

import { useEffect, useRef, useState } from "react";

export type SafetyStoryData = {
  intro: string;
  closer: string;
  pivot: string;
  newsNote: string;
  news: { quote: string; press: string; year: string; url: string }[];
  steps: { title: string; desc: string }[];
};

const STEP_VH = 50;

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * 시퀀스: intro(스크롤 트리거) → [자동 재생: 뉴스 3개 누적 → 클로저] → 체크+전환(스크롤 재개)
 * 자동 재생 동안 스크롤 잠금, 전환 화면에서 해제.
 */
export function HomeSafetyStory({ data }: { data: SafetyStoryData }) {
  const pinRef = useRef<HTMLDivElement | null>(null);
  const stepsPinRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const [newsShown, setNewsShown] = useState(0); // 0..news.length
  const [phase, setPhase] = useState<"intro" | "news" | "closer" | "pivot1" | "pivot2">("intro");
  const [stepsOn, setStepsOn] = useState(0);
  const [reduced, setReduced] = useState(false);

  const pivotLines = data.pivot
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }

    const lock = () => {
      document.documentElement.style.overflow = "hidden";
    };
    const unlock = () => {
      document.documentElement.style.overflow = "";
    };
    const later = (fn: () => void, ms: number) => {
      timersRef.current.push(window.setTimeout(fn, ms));
    };

    const startSequence = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      lock();
      setPhase("news");
      const gap = 1500;
      data.news.forEach((_, i) => {
        later(() => setNewsShown(i + 1), 300 + gap * i);
      });
      const afterNews = 300 + gap * (data.news.length - 1) + 1900;
      later(() => setPhase("closer"), afterNews);
      later(() => setPhase("pivot1"), afterNews + 2300);
      later(() => {
        setPhase("pivot2");
        unlock();
      }, afterNews + 2300 + 2300);
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
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      timersRef.current.forEach((t) => clearTimeout(t));
      unlock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.news.length, data.steps.length]);

  const isDark = phase === "news" || phase === "closer";

  // 다크 구간: 네비게이션·배너까지 검게, 하단 상담 버튼은 잠시 숨김
  useEffect(() => {
    document.body.classList.toggle("story-dark", isDark && !reduced);
    return () => document.body.classList.remove("story-dark");
  }, [isDark, reduced]);

  if (reduced) {
    return (
      <section className="lp2-story lp2-story-static" aria-label="안전한 선생님 배정">
        <div className="lp2-story-sblock"><h2>{data.intro}</h2></div>
        <div className="lp2-story-sblock dark">
          {data.news.map((n) => (
            <a key={n.quote} href={n.url} target="_blank" rel="noopener noreferrer" className="lp2-story-newsline">
              <span className="q">{n.quote}</span>
              <span className="s">{n.year} · {n.press}</span>
            </a>
          ))}
        </div>
        <div className="lp2-story-sblock dark"><h2>{data.closer}</h2></div>
        <div className="lp2-story-sblock">
          {pivotLines.map((l) => <h2 key={l}>{l}</h2>)}
        </div>
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
    <section className="lp2-story" aria-label="안전한 선생님 배정">
      <div ref={pinRef} className="lp2-story-pin" style={{ height: "240vh" }}>
        <div className={`lp2-story-stagevp${isDark ? " is-dark" : ""}`}>
          {/* 인트로 */}
          <div className={`lp2-story-item lp2-story-intro${phase === "intro" ? " is-active" : " is-passed"}`}>
            <h2>{data.intro}</h2>
          </div>

          {/* 뉴스 3개 — 자동으로 하나씩 아래로 붙음 */}
          <div
            className={`lp2-story-item lp2-story-newsstack${phase === "news" ? " is-active" : phase === "intro" ? "" : " is-passed"}`}
          >
            {data.news.map((n, i) => (
              <a
                key={n.quote}
                className={`lp2-story-newsline${i < newsShown ? " on" : ""}`}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={phase === "news" && i < newsShown ? 0 : -1}
              >
                <span className="q">{n.quote}</span>
                <span className="s">{n.year} · {n.press}</span>
              </a>
            ))}
          </div>

          {/* 클로저 */}
          <div
            className={`lp2-story-item lp2-story-closer${phase === "closer" ? " is-active" : phase === "pivot1" || phase === "pivot2" ? " is-passed" : ""}`}
          >
            <h2>{data.closer}</h2>
          </div>

          {/* 전환 1: 먼저 나왔다 사라짐 */}
          <div
            className={`lp2-story-item lp2-story-pivot${phase === "pivot1" ? " is-active" : phase === "pivot2" ? " is-passed" : ""}`}
          >
            <h2>{pivotLines[0]}</h2>
          </div>

          {/* 전환 2: 나오고 멈춤 — 여기서부터 스크롤 재개 */}
          <div className={`lp2-story-item lp2-story-pivot${phase === "pivot2" ? " is-active" : ""}`}>
            <h2>{pivotLines[1] ?? pivotLines[0]}</h2>
          </div>

          <p className="lp2-story-caption" style={{ opacity: isDark ? 1 : 0 }}>
            {data.newsNote}
          </p>
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
