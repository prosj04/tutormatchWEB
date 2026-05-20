"use client";

import { parseCmsVisibility } from "@/lib/cms-page-defaults";

type CmsVisibilityToggleProps = {
  label: string;
  section: string;
  visibilityKey: string;
  visibilityDefault?: string;
  getValue: (section: string, keyName: string, defaultValue: string) => string;
  onToggleVisible: (section: string, key: string, value: string) => Promise<void>;
};

export function CmsVisibilityToggle({
  label,
  section,
  visibilityKey,
  visibilityDefault = "1",
  getValue,
  onToggleVisible,
}: CmsVisibilityToggleProps) {
  const raw = getValue(section, visibilityKey, visibilityDefault);
  const checked = parseCmsVisibility(raw.trim() === "" ? undefined : raw, visibilityDefault !== "0");

  return (
    <label className="flex cursor-pointer select-none items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <input
        type="checkbox"
        className="size-4 shrink-0 accent-primary"
        checked={checked}
        onChange={(e) => void onToggleVisible(section, visibilityKey, e.target.checked ? "1" : "0")}
      />
      <span className="text-sm font-semibold text-text-primary">{label}</span>
    </label>
  );
}
