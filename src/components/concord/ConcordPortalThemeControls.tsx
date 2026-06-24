"use client";

import { useDesignTheme } from "@/hooks/useDesignTheme";

import { ConcordMoonIcon, ConcordSunIcon } from "./ConcordMoonIcon";

type ConcordPortalThemeControlsProps = {
  showLabel?: boolean;
};

export function ConcordPortalThemeControls({ showLabel = false }: ConcordPortalThemeControlsProps) {
  const { color, toggleMode, setColor } = useDesignTheme();

  return (
    <div className="portal-theme-controls">
      {showLabel ? <span className="portal-theme-label">테마</span> : null}
      <div className="seg" role="group" aria-label="색 테마 선택">
        <button
          type="button"
          className="g"
          aria-label="그린 테마"
          aria-pressed={color === "green"}
          onClick={() => setColor("green")}
        >
          <span className="dot" />
        </button>
        <button
          type="button"
          className="b"
          aria-label="블루 테마"
          aria-pressed={color === "blue"}
          onClick={() => setColor("blue")}
        >
          <span className="dot" />
        </button>
      </div>
      <button type="button" className="theme-toggle" onClick={toggleMode} aria-label="다크 모드 전환">
        <ConcordMoonIcon />
        <ConcordSunIcon />
      </button>
    </div>
  );
}
