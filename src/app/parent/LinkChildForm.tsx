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

  const bannerClass = message
    ? error
      ? "banner warn pa-msg"
      : "banner ok pa-msg"
    : "banner info pa-msg";

  return (
    <div className="pa-cols">
      <div className="pa-form">
        <form onSubmit={submit}>
          <div className="field pa-code">
            <label htmlFor="pa-link-code">연결 코드</label>
            <input
              id="pa-link-code"
              className="inp filled"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="A2C4E6"
              maxLength={6}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn pri" disabled={busy}>
              {busy ? "연결 중…" : "코드로 연결"}
            </button>
          </div>
        </form>
        <div className={bannerClass} role={error ? "alert" : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>
            {message
              ? message
              : "코드는 자녀 앱 MY 탭 또는 웹 대시보드 계정 페이지에서 발급해요. 자녀가 아직 학생 가입 전이면 먼저 가입이 필요해요. 방문 시 매니저가 직접 연결해 드릴 수도 있어요."}
          </span>
        </div>
      </div>

      <aside className="pa-aside">
        {linked.length === 0 ? (
          <div className="pa-rows">
            <div>
              <span className="t">연결된 자녀가 없습니다</span>
              <span className="d">자녀 앱의 연결 코드를 입력해 연결하세요.</span>
            </div>
          </div>
        ) : (
          <div className="pa-rows">
            {linked.map((c) => (
              <div key={c.id}>
                <span className="t">
                  {c.name}
                  {c.grade ? ` · ${c.grade}` : ""}
                  <i className="pa-via">{linkedViaLabel(c.linkedVia)}</i>
                </span>
                <span className="pa-row-act">
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => unlink(c.id)}
                    disabled={unlinking === c.id}
                  >
                    {unlinking === c.id ? "해제 중…" : "해제"}
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
