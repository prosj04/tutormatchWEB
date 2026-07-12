"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 운영 관측용 — 콘솔에만 남기고 사용자에게는 톤을 유지한 안내만 노출
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-lg font-bold text-text-primary">문제가 발생했어요</p>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        잠시 문제가 있었어요. 다시 시도하면 대부분 해결돼요.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <pre className="mt-4 max-h-40 w-full overflow-auto rounded-xl bg-gray-100 p-3 text-left text-xs text-gray-700">
          {error.message || "(no message)"}
        </pre>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-8 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
      >
        다시 시도
      </button>
    </div>
  );
}
