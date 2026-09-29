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
    <div className="cv-error-wrap">
      <div className="cv-error" role="alert">
        <h1>문제가 발생했어요</h1>
        <p>잠시 문제가 있었어요. 다시 시도하면 대부분 해결돼요.</p>
        {process.env.NODE_ENV === "development" ? (
          <pre>{error.message || "(no message)"}</pre>
        ) : null}
        <button type="button" onClick={() => reset()} className="btn btn-acc">
          다시 시도
        </button>
      </div>
    </div>
  );
}
