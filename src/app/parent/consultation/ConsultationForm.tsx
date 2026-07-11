"use client";

import { useState } from "react";

type Child = { id: string; name: string; grade: string | null };

/** 자녀 상담 신청 — POST /api/parent/children/[studentId]/consultation, {note} */
export function ConsultationForm({ students }: { students: Child[] }) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || busy) return;
    setBusy(true);
    setMessage(null);
    setError(false);
    try {
      const res = await fetch(`/api/parent/children/${studentId}/consultation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(true);
        setMessage(data.error ?? "상담 신청에 실패했습니다.");
      } else if (data.alreadyOpen) {
        setMessage("이미 진행 중인 상담이 있습니다.");
      } else {
        setNote("");
        setMessage("상담을 신청했습니다. 매니저가 곧 연락드립니다.");
      }
    } catch {
      setError(true);
      setMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (students.length === 0) {
    return <p className="sub">연결된 자녀가 없습니다.</p>;
  }

  return (
    <form onSubmit={submit}>
      <h2 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>새 상담 신청</h2>
      <div className="field">
        <label>자녀</label>
        <div className="opts">
          {students.map((c) => (
            <button
              key={c.id}
              type="button"
              className="opt"
              aria-pressed={c.id === studentId}
              onClick={() => setStudentId(c.id)}
            >
              {c.name}
              {c.grade ? ` · ${c.grade}` : ""}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>상담 내용</label>
        <textarea
          className="inp area"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          placeholder="상담에서 다루고 싶은 내용을 적어 주세요."
        />
      </div>
      <button type="submit" className="btn pri" style={{ width: "100%" }} disabled={busy}>
        {busy ? "신청 중…" : "상담 신청"}
      </button>
      {message && (
        <div className={error ? "banner warn" : "banner info"} style={{ marginTop: "12px" }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>{message}</span>
        </div>
      )}
    </form>
  );
}
