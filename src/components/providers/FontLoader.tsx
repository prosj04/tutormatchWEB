"use client";

import { useEffect } from "react";

const FONT_HREF =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard-dynamic-subset.css";

/**
 * Injects the Pretendard font stylesheet after the first client render so it
 * never blocks the initial paint. A <noscript> fallback is handled by the
 * preload link in layout.tsx for JS-disabled environments.
 *
 * Migration path: replace this with `next/font/local` once font files are
 * self-hosted in /public/fonts/ — that eliminates the CDN round-trip entirely.
 */
export function FontLoader() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  return null;
}
