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

type Stage =
  | { kind: "intro"; text: string }
  | { kind: "news"; quote: string; press: string; year: string; url: string }
  | { kind: "closer"; text: string }
  | { kind: "pivot"; text: string };

const STAGE_VH = 80;
const STEP_VH = 50;

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function HomeSafetyStory({ data }: { data: SafetyStoryData }) {
  const pinRef = useRef<HTMLDivElement | null>(null);
  const stepsPinRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [stepsOn, setStepsOn] = useState(0);
  const [reduced, setReduced] = useState(false);

  const pivotLines = data.pivot
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const stages: Stage[] = [
    { kind: "intro", text: data.intro },
    ...data.news.map((n) => ({ kind: "news" as const, ...n })),
    { kind: "closer", text: data.closer },
    ...pivotLines.map((line) => ({ kind: "pivot" as const, text: line })),
  ];
  const darkStart = 1;
  const darkEnd = 1 + data.news.length; // closer까지 다크

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
          // 스크롤은 스테이지 전환 트리거로만 사용 — 모션은 CSS 이징이 담당
          const idx = Math.min(stages.length - 1, Math.floor(progress * stages.length));
          setActive(idx);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages.length, data.steps.length]);

  const isDark = active >= darkStart && active <= darkEnd;

  if (reduced) {
    return (
      <section className="lp2-story lp2-story-static" aria-label="안전한 선생님 배정">
        {stages.map((st, i) => (
          <div key={i} className={`lp2-story-sblock${st.kind === "news" || st.kind === "closer" ? " dark" : ""}`}>
            {st.kind === "news" ? (
              <a href={st.url} target="_blank" rel="noopener noreferrer" className="lp2-story-newsline">
                <span className="q">{st.quote}</span>
                <span className="s">{st.year} · {st.press}</span>
              </a>
            ) : (
              <h2>{st.text}</h2>
            )}
          </div>
        ))}
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
      {/* 핀 구간 1: 카피·뉴스·클로저·전환 — 스테이지 전환 시 CSS 이징으로 스르륵 */}
      <div ref={pinRef} className="lp2-story-pin" style={{ height: `${stages.length * STAGE_VH + 100}vh` }}>
        <div className={`lp2-story-stagevp${isDark ? " is-dark" : ""}`}>
          {stages.map((st, i) => {
            const pos = i < active ? " is-passed" : i === active ? " is-active" : "";
            if (st.kind === "news") {
              return (
                <a
                  key={i}
                  className={`lp2-story-item lp2-story-newsline${pos}`}
                  href={st.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={i === active ? 0 : -1}
                >
                  <span className="q">{st.quote}</span>
                  <span className="s">{st.year} · {st.press}</span>
                </a>
              );
            }
            return (
              <div key={i} className={`lp2-story-item lp2-story-${st.kind}${pos}`}>
                <h2>{st.text}</h2>
              </div>
            );
          })}
          <p className="lp2-story-caption" style={{ opacity: isDark ? 1 : 0 }}>
            {data.newsNote}
          </p>
        </div>
      </div>

      {/* 핀 구간 2: 절차 5단계 — 하나씩 스르륵 올라와 누적 */}
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
