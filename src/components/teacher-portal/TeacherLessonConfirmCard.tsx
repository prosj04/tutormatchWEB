"use client";

import { useCallback, useEffect, useState } from "react";

type PendingLesson = {
  id: string;
  startAt: string;
  subject: string;
  durationMin: number;
  studentId: string;
  studentName: string;
};

type Fault = "STUDENT" | "NOT_STUDENT";

// 학생 과실 / 비학생 과실 사유 예시(직접 입력 포함).
const STUDENT_REASONS = ["학생 당일 취소", "학생 불참(노쇼)"];
const NOT_STUDENT_REASONS = [
  "선생님 사정으로 진행 불가",
  "천재지변·질병 등 불가피 사유",
];

function formatWhen(iso: string) {
  const d = new Date(iso);
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${min}`;
}

function initial(name: string) {
  return name.slice(0, 1);
}

/**
 * 수업 확인 제도 — 종료된 수업을 선생님이 확인 처리하는 카드.
 * "수업 완료" → COMPLETED / "수업을 하지 못했어요" → 과실 구분 + 사유 → 완료/이월.
 */
export function TeacherLessonConfirmCard() {
  const [lessons, setLessons] = useState<PendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<PendingLesson | null>(null);
  const [fault, setFault] = useState<Fault | null>(null);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/lessons/pending-confirm");
      if (!res.ok) return;
      const data = (await res.json()) as { lessons: PendingLesson[] };
      setLessons(data.lessons);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetDialog() {
    setTarget(null);
    setFault(null);
    setReason("");
    setCustomReason("");
    setMessage(null);
  }

  async function submitCompleted(lesson: PendingLesson) {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/teacher/lessons/${lesson.id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: "COMPLETED" }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(err.error ?? "처리에 실패했습니다");
        return;
      }
      resetDialog();
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNotHeld() {
    if (!target || !fault) return;
    const finalReason = (reason === "기타" ? customReason : reason).trim();
    if (!finalReason) {
      setMessage("사유를 입력해 주세요");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/teacher/lessons/${target.id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: "NOT_HELD", fault, reason: finalReason }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(err.error ?? "처리에 실패했습니다");
        return;
      }
      const data = (await res.json()) as { makeupSkippedReason?: string | null };
      if (fault === "NOT_STUDENT" && data.makeupSkippedReason) {
        setMessage(data.makeupSkippedReason);
        await load();
        return;
      }
      resetDialog();
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || lessons.length === 0) return null;

  const reasons = fault === "STUDENT" ? STUDENT_REASONS : NOT_STUDENT_REASONS;

  return (
    <div className="sec">
      <h2>확인 대기 수업</h2>
      <div className="card">
        {lessons.map((l) => (
          <div className="row" key={l.id}>
            <span className="av">{initial(l.studentName)}</span>
            <div className="g">
              <b>{l.studentName}</b>
              <p>
                {l.subject} · {formatWhen(l.startAt)}
              </p>
            </div>
            <button
              type="button"
              className="btn sm pri"
              disabled={submitting}
              onClick={() => void submitCompleted(l)}
            >
              수업 완료
            </button>
            <button
              type="button"
              className="btn sm ghost"
              disabled={submitting}
              onClick={() => {
                resetDialog();
                setTarget(l);
              }}
            >
              수업을 하지 못했어요
            </button>
          </div>
        ))}
      </div>

      {target ? (
        <div className="card" style={{ marginTop: 12 }}>
          <p style={{ fontWeight: 700 }}>
            {target.studentName} · {formatWhen(target.startAt)} 수업
          </p>

          {/* 과실 구분 */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              type="button"
              className={`btn sm ${fault === "STUDENT" ? "sec" : "ghost"}`}
              onClick={() => {
                setFault("STUDENT");
                setReason("");
                setMessage(null);
              }}
            >
              학생 과실
            </button>
            <button
              type="button"
              className={`btn sm ${fault === "NOT_STUDENT" ? "sec" : "ghost"}`}
              onClick={() => {
                setFault("NOT_STUDENT");
                setReason("");
                setMessage(null);
              }}
            >
              학생 과실 아님
            </button>
          </div>

          {fault ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[...reasons, "기타"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`btn sm ${reason === r ? "sec" : "ghost"}`}
                    onClick={() => setReason(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {reason === "기타" ? (
                <input
                  type="text"
                  className="inp"
                  placeholder="사유를 입력해 주세요"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  style={{ marginTop: 10, width: "100%" }}
                />
              ) : null}

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn pri"
                  disabled={submitting || !reason}
                  onClick={() => void submitNotHeld()}
                >
                  {fault === "STUDENT" ? "완료 처리" : "마지막 수업으로 변경하기"}
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  style={{ marginLeft: 8 }}
                  disabled={submitting}
                  onClick={resetDialog}
                >
                  취소
                </button>
              </div>
            </div>
          ) : null}

          {message ? (
            <p style={{ marginTop: 10, color: "var(--fg)" }}>{message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
