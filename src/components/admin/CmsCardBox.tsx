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
    <div className="w-full max-w-[360px] rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <label className="mb-4 flex cursor-pointer select-none items-center gap-2 rounded-xl border border-gray-100 bg-background px-3 py-2">
        <input
          type="checkbox"
          className="size-4 shrink-0 accent-primary"
          checked={checked}
          onChange={(e) => void onToggleVisible(section, visibilityKey, e.target.checked ? "1" : "0")}
        />
        <span className="text-xs font-bold uppercase tracking-wider text-primary">{label}</span>
        <span className="text-sm font-semibold text-text-primary">표시</span>
      </label>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

/** 홈 탭 등 2열 그리드 (공개 화면과 비슷한 좁은 카드 폭) */
export function CmsCardBoxGrid({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-4 lg:gap-5">{children}</div>
  );
}
