"use client";

import { useEffect, useState } from "react";

type PendingTeacher = {
  id: string;
  name: string;
  email: string;
  subjects: string;
  phone: string;
  createdAt: string;
};

type PendingTeachersResponse = {
  pendingTeachers?: PendingTeacher[];
  error?: string;
};

export default function ChiefManagerTeacherApprovalPage() {
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPendingTeachers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chief-manager/teacher-approval", { cache: "no-store" });
      const data = (await res.json()) as PendingTeachersResponse;
      if (!res.ok) {
        setError(data.error ?? "승인 대기 선생님을 불러오지 못했습니다.");
        return;
      }
      setPendingTeachers(data.pendingTeachers ?? []);
    } catch {
      setError("승인 대기 선생님을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPendingTeachers();
  }, []);

  async function handleApproval(teacherId: string, approve: boolean) {
    setSubmittingId(teacherId);
    setError(null);
    try {
      const res = await fetch("/api/chief-manager/teacher-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, approve }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "승인 상태 변경에 실패했습니다.");
        return;
      }
      setPendingTeachers((current) => current.filter((teacher) => teacher.id !== teacherId));
    } catch {
      setError("승인 상태 변경에 실패했습니다.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <section className="page on" data-screen-label="치프 승인">
      <div className="crumb">/chief-manager/teacher-approval</div>
      <h1>치프 최종 승인</h1>
      <p className="sub">매니저 승인을 거친 선생님의 최종 승인 큐입니다.</p>

      {error ? (
        <div className="sec banner err">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="sec card">
        {loading ? (
          <div className="row"><div className="g"><p>불러오는 중…</p></div></div>
        ) : pendingTeachers.length === 0 ? (
          <div className="empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            <b>승인 대기 중인 선생님이 없습니다.</b>
          </div>
        ) : (
          pendingTeachers.map((teacher) => (
            <div key={teacher.id} className="row">
              <span className="av">{teacher.name.slice(0, 1)}</span>
              <div className="g">
                <b>{teacher.name} · {teacher.subjects}</b>
                <p>{teacher.email} · {teacher.phone}</p>
              </div>
              <span className="bst warn">최종 대기</span>
              <button
                type="button"
                className="btn sec sm"
                disabled={submittingId === teacher.id}
                onClick={() => void handleApproval(teacher.id, false)}
              >
                반려
              </button>
              <button
                type="button"
                className="btn pri sm"
                disabled={submittingId === teacher.id}
                onClick={() => void handleApproval(teacher.id, true)}
              >
                최종 승인
              </button>
            </div>
          ))
        )}
      </div>

      <div className="sec banner ok">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
        <span>최종 승인 시 선생님에게 알림이 발송되고 매칭 풀에 공개됩니다.</span>
      </div>
    </section>
  );
}
