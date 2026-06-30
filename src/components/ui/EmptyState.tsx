import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
};

/**
 * 빈 값(초기 상태) 공통 표시.
 * 원칙: "아직 없음 + 이유 + 다음 행동(CTA)"
 */
export function EmptyState({
  title,
  description,
  icon,
  ctaLabel,
  onCta,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-10 text-center ${className}`}
    >
      {icon && (
        <div className="mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent/10 text-2xl">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-bold text-text">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-[280px] text-[13px] leading-5 text-text-muted">
          {description}
        </p>
      )}
      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-4 rounded-xl bg-accent/12 px-[18px] py-2.5 text-[13.5px] font-bold text-accent-text"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
