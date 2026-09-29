type ErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

/**
 * API/네트워크 오류 공통 표시 (EmptyState와 구분).
 * v3: ds.css `.empty` 문법 + 재시도 버튼.
 */
export function ErrorState({
  title = "불러오지 못했어요",
  description = "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
  retryLabel = "다시 시도",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`empty ${className}`.trim()}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <b>{title}</b>
      <p>{description}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn btn-ghost btn-sm" style={{ marginTop: "18px" }}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
