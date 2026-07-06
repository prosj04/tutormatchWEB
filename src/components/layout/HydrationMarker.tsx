"use client";

import { useEffect } from "react";

/** React 하이드레이션 성공 표식 — concord.css의 .reveal fail-safe를 해제한다. */
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.classList.add("js-hydrated");
  }, []);
  return null;
}
