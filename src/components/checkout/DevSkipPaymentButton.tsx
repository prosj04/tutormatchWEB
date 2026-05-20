"use client";

/**
 * DELETE ME — 임시: 결제 스킵 (모든 환경; 제거 전 프로덕션에서 삭제할 것)
 */
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

export function DevSkipPaymentButton() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/skip-payment-enroll", { method: "POST" });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        redirect?: string;
      } | null;
      if (!res.ok) {
        alert(data?.error ?? "실패했습니다.");
        return;
      }
      router.push(data?.redirect ?? "/dashboard/consultation?visit=1");
      router.refresh();
    } catch {
      alert("실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading || session?.user?.role !== "STUDENT"}
      onClick={() => void handleClick()}
      className="w-full rounded-xl border border-dashed border-amber-400 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-50"
      title={session?.user?.role !== "STUDENT" ? "학생 로그인 필요" : undefined}
    >
      {loading ? "처리 중…" : "[DEV] 결제 없이 등록"}
    </button>
  );
}
