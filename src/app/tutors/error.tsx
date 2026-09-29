"use client";

export default function TutorsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const raw = error.message ?? "";
  const migrateHint =
    /gender|visitPreferredTimes|column|does not exist|P2022/i.test(raw) ||
    raw.includes("Unknown arg");

  return (
    <main className="sec">
      <div className="wrap-narrow mk-state">
        <h1 className="h2">강사진 페이지를 불러오지 못했습니다.</h1>
        <p className="lede">
          {migrateHint
            ? "배포 서버에서 DB 마이그레이션(prisma migrate deploy)이 적용됐는지 확인해 주세요."
            : "잠시 후 다시 시도하거나 관리자에게 문의해 주세요."}
        </p>
        {process.env.NODE_ENV === "development" ? (
          <pre className="mk-state-detail">{raw || "(no message)"}</pre>
        ) : null}
        <button type="button" onClick={() => reset()} className="btn btn-acc">
          다시 시도
        </button>
      </div>
    </main>
  );
}
