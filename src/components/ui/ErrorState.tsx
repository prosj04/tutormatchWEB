type ErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

/**
 * API/네트워크 오류 공통 표시 (EmptyState와 구분).
 */
export function ErrorState({
  title = "불러오지 못했어요",
  description = "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
  retryLabel = "다시 시도",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <div className="mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-red-500/10 text-xl font-extrabold text-red-500">
        !
      </div>
      <p className="text-[15px] font-bold text-text">{title}</p>
      <p className="mt-1.5 max-w-[280px] text-[13px] leading-5 text-text-muted">
        {description}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-[13.5px] font-bold text-white"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
