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

export default function ManagerTeacherApprovalPage() {
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPendingTeachers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/manager/teacher-approval", { cache: "no-store" });
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
      const res = await fetch("/api/manager/teacher-approval", {
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
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-primary">Teacher Approval</p>
        <h1 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
          선생님 승인 관리
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          승인 권한이 있는 계정만 선생님 가입을 승인하거나 반려할 수 있습니다.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-2xl border border-gray-200 bg-surface p-6 text-sm text-text-secondary">
          불러오는 중…
        </p>
      ) : pendingTeachers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-surface p-8 text-center text-sm text-text-secondary">
          승인 대기 중인 선생님이 없습니다.
        </p>
      ) : (
        <ul className="space-y-3">
          {pendingTeachers.map((teacher) => (
            <li
              key={teacher.id}
              className="rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">{teacher.name}</h2>
                  <p className="mt-1 text-sm text-text-secondary">{teacher.email}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {teacher.subjects} · {teacher.phone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={submittingId === teacher.id}
                    onClick={() => void handleApproval(teacher.id, true)}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    disabled={submittingId === teacher.id}
                    onClick={() => void handleApproval(teacher.id, false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-text-secondary disabled:opacity-50"
                  >
                    반려
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
