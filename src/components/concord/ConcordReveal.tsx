"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";

export function ConcordReveal({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
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

  return (
    <Tag ref={ref as never} className={`reveal ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
