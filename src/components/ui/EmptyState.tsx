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
 * v3: ds.css `.empty` — 세리프 한 줄 + 보조 문장, 박스 없음.
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
    <div className={`empty ${className}`.trim()}>
      {icon}
      <b>{title}</b>
      {description && <p>{description}</p>}
      {ctaLabel && onCta && (
        <button type="button" onClick={onCta} className="btn btn-ghost btn-sm" style={{ marginTop: "18px" }}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
