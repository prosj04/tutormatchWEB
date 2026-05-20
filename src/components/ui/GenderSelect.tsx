"use client";

import type { ProfileGender } from "@/lib/profile-gender";

const labelClass = "text-xs font-semibold uppercase tracking-wider text-text-muted";

type GenderSelectProps = {
  value: ProfileGender | "";
  onChange: (value: ProfileGender) => void;
  error?: string;
  className?: string;
};

export function GenderSelect({ value, onChange, error, className = "" }: GenderSelectProps) {
  return (
    <div className={className}>
      <span className={labelClass}>성별</span>
      <div className="mt-2 flex gap-2">
        {(
          [
            { id: "MALE" as const, label: "남" },
            { id: "FEMALE" as const, label: "여" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition ${
              value === opt.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 bg-background text-text-secondary hover:border-gray-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
