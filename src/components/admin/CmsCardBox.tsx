"use client";

import type { ReactNode } from "react";

import { parseCmsVisibility } from "@/lib/cms-page-defaults";

type CmsCardBoxProps = {
  /** 예: "요금 카드 박스 1", "결과 카드 박스 2" */
  label: string;
  section: string;
  visibilityKey: string;
  /** DB에 값이 없을 때 체크 상태용 기본값 (요금 박스 5~6 등) */
  visibilityDefault?: string;
  getValue: (section: string, keyName: string, defaultValue: string) => string;
  onToggleVisible: (section: string, key: string, value: string) => Promise<void>;
  children: ReactNode;
};

export function CmsCardBox({
  label,
  section,
  visibilityKey,
  visibilityDefault = "1",
  getValue,
  onToggleVisible,
  children,
}: CmsCardBoxProps) {
  const raw = getValue(section, visibilityKey, visibilityDefault);
  const checked = parseCmsVisibility(raw.trim() === "" ? undefined : raw, true);

  return (
    <div className="ad-cardbox">
      <label className="ad-cardbox-h">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => void onToggleVisible(section, visibilityKey, e.target.checked ? "1" : "0")}
        />
        <span className="ad-cardbox-l">{label}</span>
        <span className="ad-cardbox-s">표시</span>
      </label>
      <div className="ad-cardbox-b">{children}</div>
    </div>
  );
}

/** 홈 탭 등 2열 그리드 (공개 화면과 비슷한 좁은 카드 폭) */
export function CmsCardBoxGrid({ children }: { children: ReactNode }) {
  return <div className="ad-cardbox-grid">{children}</div>;
}
