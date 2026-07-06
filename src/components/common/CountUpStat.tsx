"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1200;

function parseStatValue(raw: string): { prefix: string; target: number; decimals: number; suffix: string } | null {
  const match = raw.trim().match(/^([^0-9]*)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const numeric = match[2].replace(/,/g, "");
  const target = Number(numeric);
  if (!Number.isFinite(target)) return null;
  const decimals = numeric.includes(".") ? numeric.split(".")[1].length : 0;
  return { prefix: match[1], target, decimals, suffix: match[3] };
}

function formatStat(value: number, decimals: number) {
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 뷰포트 진입 시 0 → 목표값 카운트업 숫자.
 * "1,200+", "98%", "4.9" 같은 문자열을 그대로 받아 suffix를 유지한다.
 * prefers-reduced-motion 환경에서는 즉시 최종값 표시.
 */
export function CountUpStat({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const parsed = parseStatValue(value);
    const el = ref.current;
    if (!parsed || !el) {
      setDisplay(value);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    const { prefix, target, decimals, suffix } = parsed;
    setDisplay(`${prefix}${formatStat(0, decimals)}${suffix}`);

    let rafId = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / DURATION_MS, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(`${prefix}${formatStat(target * eased, decimals)}${suffix}`);
          if (t < 1) rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
