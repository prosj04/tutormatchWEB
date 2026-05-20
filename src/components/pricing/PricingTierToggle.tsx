"use client";

import type { PricingSchoolTier } from "@/lib/pricing-plans";

const OPTIONS: { value: PricingSchoolTier; label: string }[] = [
  { value: "middle", label: "중등" },
  { value: "high", label: "고등" },
];

type PricingTierToggleProps = {
  value: PricingSchoolTier;
  onChange: (tier: PricingSchoolTier) => void;
  className?: string;
};

/** 사이트 콘텐츠 관리 페이지 상단 탭(홈·요금제·…)과 동일한 탭 스타일 */
export function PricingTierToggle({ value, onChange, className = "" }: PricingTierToggleProps) {
  return (
    <nav
      role="tablist"
      aria-label="학년"
      className={`flex flex-wrap gap-2 border-b border-gray-200 pb-1 ${className}`}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            value === opt.value
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-secondary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </nav>
  );
}
