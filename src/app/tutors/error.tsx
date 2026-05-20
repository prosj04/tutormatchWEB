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
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-lg font-bold text-text-primary">강사진 페이지를 불러오지 못했습니다.</p>
      <p className="mt-3 text-sm text-text-secondary">
        {migrateHint
          ? "배포 서버에서 DB 마이그레이션(prisma migrate deploy)이 적용됐는지 확인해 주세요."
          : "잠시 후 다시 시도하거나 관리자에게 문의해 주세요."}
      </p>
      {process.env.NODE_ENV === "development" ? (
        <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-gray-100 p-3 text-left text-xs text-gray-700">
          {raw || "(no message)"}
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
