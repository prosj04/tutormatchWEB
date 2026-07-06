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

export function HomeSafetyStory({ data }: { data: SafetyStoryData }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-story-block]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      blocks.forEach((b) => b.classList.add("is-in"));
      return;
    }

    const fadeIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          (e.target as HTMLElement).classList.toggle("is-in", e.isIntersecting);
        });
      },
      { rootMargin: "-10% 0px -10% 0px", threshold: 0.08 },
    );
    blocks.forEach((b) => fadeIo.observe(b));

    const darkZone = root.querySelector<HTMLElement>("[data-story-dark]");
    let phaseIo: IntersectionObserver | undefined;
    if (darkZone) {
      phaseIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => setPhase(e.isIntersecting ? "dark" : "light"));
        },
        { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
      );
      phaseIo.observe(darkZone);
    }

    return () => {
      fadeIo.disconnect();
      phaseIo?.disconnect();
    };
  }, []);

  return (
    <section ref={rootRef} className="lp2-story" data-phase={phase} aria-label="안전한 선생님 배정">
      <div className="lp2-story-block lp2-story-intro" data-story-block>
        <h2 style={{ whiteSpace: "pre-line" }}>{data.intro}</h2>
      </div>

      <div className="lp2-story-darkzone" data-story-dark>
        {data.news.map((n) => (
          <a
            key={n.quote}
            className="lp2-story-clip lp2-story-block"
            data-story-block
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="q">{n.quote}</span>
            <span className="s">
              {n.year} · {n.press}
            </span>
          </a>
        ))}
        <p className="lp2-story-note lp2-story-block" data-story-block>
          {data.newsNote}
        </p>
        <div className="lp2-story-block lp2-story-closer" data-story-block>
          <h2 style={{ whiteSpace: "pre-line" }}>{data.closer}</h2>
        </div>
      </div>

      {data.pivot
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => (
          <div key={line} className="lp2-story-block lp2-story-pivot" data-story-block>
            <h2>{line}</h2>
          </div>
        ))}

      <ol className="lp2-story-steps">
        {data.steps.map((s, i) => (
          <li key={s.title} className="lp2-story-step lp2-story-block" data-story-block>
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
