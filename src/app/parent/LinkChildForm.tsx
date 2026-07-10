"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** 연결 코드로 자녀 연결 — POST /api/parent/link */
export function LinkChildForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/parent/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "연결에 실패했습니다.");
      } else {
        setCode("");
        setMessage("자녀를 연결했습니다.");
        router.refresh();
      }
    } catch {
      setMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label className="text-sm font-medium">자녀 연결 코드 입력</label>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="6자리 코드"
          maxLength={6}
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          연결
        </button>
      </div>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
  );
}
