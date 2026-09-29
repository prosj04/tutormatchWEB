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
    <label className="ad-vis">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => void onToggleVisible(section, visibilityKey, e.target.checked ? "1" : "0")}
      />
      <span>{label}</span>
    </label>
  );
}
