"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type LinkedChild = {
  id: string;
  name: string;
  grade: string | null;
  linkedVia: string;
};

function linkedViaLabel(via: string): string {
  if (via === "MANAGER") return "매니저 연결";
  if (via === "QR") return "QR 연결";
  return "코드로 연결";
}

/** 연결 코드로 자녀 연결 + 연결 목록/해제 — 시안 pg-link. */
export function LinkChildForm({ linked }: { linked: LinkedChild[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    setError(false);
    try {
      const res = await fetch("/api/parent/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(true);
        setMessage(data.error ?? "연결에 실패했습니다.");
      } else {
        setCode("");
        setMessage("자녀를 연결했습니다.");
        router.refresh();
      }
    } catch {
      setError(true);
      setMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function unlink(studentId: string) {
    if (unlinking) return;
    setUnlinking(studentId);
    try {
      const res = await fetch(`/api/parent/link/${studentId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(true);
        setMessage(data.error ?? "연결 해제에 실패했습니다.");
      }
    } catch {
      setError(true);
      setMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setUnlinking(null);
    }
  }

  return (
    <div className="sec grid2">
      <div className="card" style={{ padding: "20px" }}>
        <form onSubmit={submit}>
          <div className="field">
            <label>연결 코드</label>
            <input
              className="inp filled"
              style={{ textAlign: "center", fontSize: "20px", fontWeight: 800, letterSpacing: ".3em", color: "var(--fg)" }}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="코드 입력"
              maxLength={6}
            />
          </div>
          <button type="submit" className="btn pri" style={{ width: "100%" }} disabled={busy}>
            {busy ? "연결 중…" : "코드로 연결"}
          </button>
        </form>
        <div
          className={`banner ${message && !error ? "ok" : "warn"}`}
          style={{ marginTop: "12px" }}
          role={error ? "alert" : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>
            {message
              ? message
              : "코드가 만료되면 자녀 앱에서 재발급 후 다시 시도하세요. 방문 시 매니저가 직접 연결해 드릴 수도 있어요."}
          </span>
        </div>
      </div>

      <div className="card">
        {linked.length === 0 ? (
          <div className="row">
            <div className="g">
              <b>연결된 자녀가 없습니다</b>
              <p>자녀 앱의 연결 코드를 입력해 연결하세요.</p>
            </div>
          </div>
        ) : (
          linked.map((c) => (
            <div key={c.id} className="row">
              <span className="av">{c.name.slice(0, 1)}</span>
              <div className="g">
                <b>
                  {c.name}
                  {c.grade ? ` · ${c.grade}` : ""}
                </b>
                <p>{linkedViaLabel(c.linkedVia)}</p>
              </div>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => unlink(c.id)}
                disabled={unlinking === c.id}
              >
                {unlinking === c.id ? "해제 중…" : "해제"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
