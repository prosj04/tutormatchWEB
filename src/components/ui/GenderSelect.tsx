"use client";

import type { ProfileGender } from "@/lib/profile-gender";

type GenderSelectProps = {
  value: ProfileGender | "";
  onChange: (value: ProfileGender) => void;
  error?: string;
  className?: string;
};

export function GenderSelect({ value, onChange, error, className = "" }: GenderSelectProps) {
  return (
    <div className={`field${className ? ` ${className}` : ""}`}>
      <label>성별</label>
      <div className="seg-tabs" style={{ marginTop: 8 }}>
        {(
          [
            { id: "MALE" as const, label: "남" },
            { id: "FEMALE" as const, label: "여" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={value === opt.id ? "on" : undefined}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {error ? (
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--acc-text)" }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
