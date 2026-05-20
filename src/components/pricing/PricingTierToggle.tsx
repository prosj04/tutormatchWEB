"use client";

import type { PricingSchoolTier } from "@/lib/pricing-plans";

const OPTIONS: { value: PricingSchoolTier; label: string }[] = [
  { value: "middle", label: "중등" },
  { value: "high", label: "고등" },
];

type PricingTierToggleProps = {
  value: PricingSchoolTier;
  onChange: (tier: PricingSchoolTier) => void;
  /** 예: 카드 영역 안 왼쪽 상단 */
  className?: string;
};

export function PricingTierToggle({ value, onChange, className = "" }: PricingTierToggleProps) {
  return (
    <div
      role="group"
      aria-label="학년"
      className={`inline-flex rounded-full border border-neutral-200/80 bg-neutral-100 p-0.5 text-[11px] font-black text-neutral-600 shadow-sm md:text-xs ${className}`}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          className={`rounded-full px-2.5 py-1 tracking-normal transition md:px-3 ${
            value === opt.value
              ? "bg-white text-primary shadow-sm ring-1 ring-neutral-200/70"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
