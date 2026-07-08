"use client";

import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

export function ConcordReveal({
  children,
  className = "",
  as: Tag = "div",
  delay,
  style,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
  /** Optional stagger delay in ms. Clamped to a per-element cap so staggers stay snappy. Inert when prefers-reduced-motion is set. */
  delay?: number;
} & HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      el.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);

    return () => {
      io.disconnect();
    };
  }, []);

  // Cap stagger delay so no element lingers hidden (per-element stagger 60~80ms).
  const REVEAL_DELAY_CAP = 80;
  const clampedDelay =
    delay != null ? Math.max(0, Math.min(delay, REVEAL_DELAY_CAP)) : null;
  const mergedStyle: CSSProperties | undefined =
    clampedDelay != null ? { transitionDelay: `${clampedDelay}ms`, ...style } : style;

  return (
    <Tag ref={ref as never} className={`reveal ${className}`.trim()} style={mergedStyle} {...rest}>
      {children}
    </Tag>
  );
}
