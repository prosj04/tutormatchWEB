"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

const CONFIRM_WORD = "삭제";

export function AccountDeleteSection() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        setError("계정 삭제에 실패했습니다. 잠시 후 다시 시도하거나 help@concordedu.kr 로 문의해 주세요.");
        return;
      }
      await signOut({ redirectTo: "/" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="account-delete-title"
      style={{
        marginTop: 48,
        padding: "20px 22px",
        border: "1px solid var(--line, #e5e5e0)",
        borderRadius: 18,
      }}
    >
      <h2 id="account-delete-title" className="text-base font-bold" style={{ color: "var(--fg, #1a1a18)" }}>
        계정 삭제
      </h2>
      <p className="mt-2 text-sm" style={{ color: "var(--mut, #6b6b64)" }}>
        계정을 삭제하면 더 이상 로그인할 수 없으며, 관련 법령에 따라 보관이 필요한 정보를 제외한
        개인정보는 개인정보처리방침에 따라 파기됩니다. 진행 중인 수업·결제가 있다면 삭제 전에
        먼저 문의해 주세요.
      </p>
      {!open ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => setOpen(true)}
        >
          계정 삭제 진행
        </button>
      ) : (
        <div style={{ marginTop: 14 }}>
          <label htmlFor="account-delete-confirm" className="text-sm" style={{ color: "var(--mut, #6b6b64)" }}>
            계속하려면 아래에 <strong>{CONFIRM_WORD}</strong>를 입력하세요.
          </label>
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              id="account-delete-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid var(--line, #e5e5e0)",
                borderRadius: 10,
                fontSize: 14,
              }}
            />
            <button
              type="button"
              className="btn btn-sm"
              disabled={confirmText.trim() !== CONFIRM_WORD || loading}
              onClick={() => void handleDelete()}
              style={{ background: "#c0392b", color: "#fff", opacity: confirmText.trim() === CONFIRM_WORD ? 1 : 0.5 }}
            >
              {loading ? "삭제 중…" : "영구 삭제"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); setConfirmText(""); }}>
              취소
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-sm" role="alert" style={{ color: "#c0392b" }}>
              {error}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
