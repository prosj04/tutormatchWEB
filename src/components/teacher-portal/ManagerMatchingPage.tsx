"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DefaultAvatar } from "@/components/ui/DefaultAvatar";
import { todayDateKey } from "@/lib/study-plan-dates";

type MatchStudent = {
  id: string;
  name: string;
  grade: string;
  subjects: string;
  consultationNote: string | null;
};

type MatchTeacher = {
  id: string;
  name: string;
  subjects: string;
  photoUrl: string | null;
  activeStudentCount: number;
};

function parseSubjects(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ManagerMatchingPage() {
  const [students, setStudents] = useState<MatchStudent[]>([]);
  const [teachers, setTeachers] = useState<MatchTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [matchSubjects, setMatchSubjects] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/manager/matches");
      if (!res.ok) return;
      const data = (await res.json()) as {
        students: MatchStudent[];
        teachers: MatchTeacher[];
      };
      setStudents(data.students);
      setTeachers(data.teachers);
      setSelectedId((prev) => {
        if (data.students.length === 0) return null;
        if (prev && data.students.some((s) => s.id === prev)) return prev;
        return data.students[0].id;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = students.find((s) => s.id === selectedId);

  const studentSubjectList = useMemo(
    () => (selected ? parseSubjects(selected.subjects) : []),
    [selected],
  );

  const filteredTeachers = useMemo(() => {
    if (!selected || studentSubjectList.length === 0) return teachers;
    return teachers.filter((t) => {
      const ts = parseSubjects(t.subjects);
      return studentSubjectList.some((s) =>
        ts.some((tt) => tt.includes(s) || s.includes(tt)),
      );
    });
  }, [teachers, selected, studentSubjectList]);

  useEffect(() => {
    if (!selected) {
      setMatchSubjects([]);
      return;
    }
    setMatchSubjects(studentSubjectList);
    setTeacherId(null);
  }, [selected, studentSubjectList]);

  function toggleSubject(s: string) {
    setMatchSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function handleMatch() {
    if (!selected || !teacherId || matchSubjects.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/manager/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selected.id,
          teacherId,
          subjects: matchSubjects.join(", "),
          startDate: todayDateKey(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "매칭에 실패했습니다.");
        return;
      }
      await load();
      setTeacherId(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-text-primary sm:text-3xl">매칭 관리</h1>
      <p className="mt-2 text-sm text-text-secondary">
        상담 완료 학생을 담당 선생님에게 배정합니다.
      </p>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-80">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            상담 완료 학생
          </h2>
          {loading ? (
            <p className="text-sm text-text-secondary">불러오는 중…</p>
          ) : students.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-surface p-6 text-center text-sm text-text-secondary">
              매칭 대기 학생이 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {students.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedId === s.id
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-gray-200 bg-surface hover:border-primary/40"
                    }`}
                  >
                    <p className="font-semibold text-text-primary">{s.name}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{s.grade}</p>
                    <p className="mt-1 text-xs text-primary">{s.subjects}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-surface p-6">
          {!selected ? (
            <p className="text-sm text-text-secondary">학생을 선택해주세요.</p>
          ) : (
            <>
              <h2 className="text-lg font-bold text-text-primary">{selected.name}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {selected.grade} · 희망과목: {selected.subjects}
              </p>
              {selected.consultationNote ? (
                <p className="mt-3 rounded-lg bg-background px-3 py-2 text-sm text-text-secondary">
                  상담 메모: {selected.consultationNote}
                </p>
              ) : null}

              <h3 className="mt-8 text-sm font-semibold text-text-primary">
                선생님 선택
              </h3>
              {filteredTeachers.length === 0 ? (
                <p className="mt-2 text-sm text-text-secondary">
                  조건에 맞는 선생님이 없습니다.
                </p>
              ) : (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {filteredTeachers.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setTeacherId(t.id)}
                        className={`w-full rounded-xl border p-4 text-left ${
                          teacherId === t.id
                            ? "border-primary bg-primary/10"
                            : "border-gray-100 hover:border-primary/30"
                        }`}
                      >
                        <span className="flex items-start gap-3">
                          {t.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={t.photoUrl}
                              alt={`${t.name} 프로필 사진`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <DefaultAvatar size={40} />
                          )}
                          <span>
                            <span className="block font-medium text-text-primary">{t.name}</span>
                            <span className="mt-0.5 block text-xs text-text-secondary">{t.subjects}</span>
                            <span className="mt-1 block text-xs text-text-muted">
                              담당 학생 {t.activeStudentCount}명
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="mt-8 text-sm font-semibold text-text-primary">
                담당 과목
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {studentSubjectList.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                      matchSubjects.includes(s)
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-text-secondary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {error ? (
                <p className="mt-4 text-sm text-accent" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                disabled={!teacherId || matchSubjects.length === 0 || submitting}
                onClick={() => void handleMatch()}
                className="mt-8 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 sm:w-auto sm:px-10"
              >
                {submitting ? "등록 중…" : "매칭 등록"}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
