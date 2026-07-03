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
  /** Optional stagger delay in ms. Inert when prefers-reduced-motion is set. */
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

    const fallback = window.setTimeout(() => {
      if (!el.classList.contains("in")) el.classList.add("in");
    }, 2400);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  const mergedStyle: CSSProperties | undefined =
    delay != null ? { transitionDelay: `${delay}ms`, ...style } : style;

  return (
    <Tag ref={ref as never} className={`reveal ${className}`.trim()} style={mergedStyle} {...rest}>
      {children}
    </Tag>
  );
}
