"use client";

import { useState } from "react";

type Child = { id: string; name: string };

/** 자녀 상담 신청 — POST /api/parent/children/[studentId]/consultation */
export function ConsultationForm({ students }: { students: Child[] }) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/parent/children/${studentId}/consultation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: note.trim() }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "상담 신청에 실패했습니다.");
      } else if (data.alreadyOpen) {
        setMessage("이미 진행 중인 상담이 있습니다.");
      } else {
        setNote("");
        setMessage("상담을 신청했습니다. 매니저가 곧 연락드립니다.");
      }
    } catch {
      setMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (students.length === 0) {
    return <p className="text-sm text-gray-500">연결된 자녀가 없습니다.</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-sm font-medium">자녀 선택</label>
      <select
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="rounded border px-3 py-2"
      >
        {students.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <label className="text-sm font-medium">상담 요청 내용 (선택)</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        maxLength={2000}
        className="rounded border px-3 py-2"
        placeholder="상담에서 다루고 싶은 내용을 적어 주세요."
      />

      <button
        type="submit"
        disabled={busy}
        className="self-start rounded bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        상담 신청
      </button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
  );
}
