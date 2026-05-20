"use client";

import { useCallback, useEffect, useState } from "react";

import { getEffectivePhotoUrl } from "@/lib/profile-gender";

const SUBJECT_PILLS = ["국어", "영어", "수학", "사회탐구", "과학탐구"];

type TeacherItem = {
  id: string;
  name: string;
  approved: boolean;
  photoUrl: string | null;
  gender: string | null;
  _count?: { students: number };
};

type MatchRow = {
  id: string;
  teacherId: string;
  studentId: string;
  subjects: string;
  startDate: string;
  isActive: boolean;
  teacher: { id: string; name: string };
  student: { id: string; name: string; grade: string };
};

type StudentOption = { id: string; name: string; grade: string };

export function AdminMatchesPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const loadTeachers = useCallback(async () => {
    const res = await fetch("/api/admin/teachers?status=approved&limit=100");
    if (res.ok) {
      const data = (await res.json()) as { teachers: TeacherItem[] };
      const list = data.teachers;
      setTeachers(list);
      if (list.length > 0) {
        setSelectedTeacherId((prev) => prev ?? list[0].id);
      }
    }
  }, []);

  const loadMatches = useCallback(async () => {
    const res = await fetch("/api/admin/matches");
    if (res.ok) {
      const data = (await res.json()) as { matches: MatchRow[] };
      setMatches(data.matches);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
    loadMatches();
  }, [loadTeachers, loadMatches]);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);
  const teacherMatches = matches.filter(
    (m) => m.teacherId === selectedTeacherId && m.isActive,
  );

  async function openAddModal() {
    if (!selectedTeacherId) return;
    const res = await fetch(
      `/api/admin/students?unmatchedFor=${selectedTeacherId}&limit=100`,
    );
    if (res.ok) {
      const data = (await res.json()) as { students: StudentOption[] };
      setStudentOptions(data.students);
      setStudentId(data.students[0]?.id ?? "");
      setSelectedSubjects([]);
      setModalOpen(true);
    }
  }

  function toggleSubject(s: string) {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function createMatch() {
    if (!selectedTeacherId || !studentId || selectedSubjects.length === 0) return;
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId: selectedTeacherId,
        studentId,
        subjects: selectedSubjects.join(","),
        startDate,
      }),
    });
    if (res.ok) {
      setModalOpen(false);
      loadMatches();
    }
  }

  async function deactivateMatch(id: string) {
    if (!confirm("매칭을 해제하시겠습니까?")) return;
    await fetch(`/api/admin/matches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    loadMatches();
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-text-primary">매칭 관리</h2>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <h3 className="text-xs font-semibold uppercase text-text-muted">선생님 (승인됨)</h3>
          <ul className="mt-3 space-y-2">
            {teachers.map((t) => {
              const count = matches.filter(
                (m) => m.teacherId === t.id && m.isActive,
              ).length;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                      selectedTeacherId === t.id
                        ? "border-primary bg-primary/10 font-semibold"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getEffectivePhotoUrl(t.photoUrl, t.gender)}
                        alt={`${t.name} 프로필`}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <span>
                        <span className="block">{t.name}</span>
                        <span className="mt-0.5 block text-xs text-text-muted">
                          매칭 {count}명
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {selectedTeacher ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold">{selectedTeacher.name} · 매칭 현황</h3>
                <button
                  type="button"
                  onClick={() => openAddModal()}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  학생 추가
                </button>
              </div>

              <ul className="mt-6 space-y-3">
                {teacherMatches.length === 0 ? (
                  <li className="text-sm text-text-secondary">활성 매칭이 없습니다.</li>
                ) : (
                  teacherMatches.map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-background px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-text-primary">
                          {m.student.name}{" "}
                          <span className="text-text-secondary">({m.student.grade})</span>
                        </p>
                        <p className="text-xs text-text-muted">
                          {m.subjects} · 시작 {m.startDate}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deactivateMatch(m.id)}
                        className="text-sm text-accent hover:underline"
                      >
                        매칭 해제
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </>
          ) : (
            <p className="text-sm text-text-secondary">선생님을 선택해 주세요.</p>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold">학생 매칭 등록</h3>
            <label className="mt-4 block text-xs font-semibold text-text-muted">학생</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            >
              {studentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.grade})
                </option>
              ))}
            </select>
            <p className="mt-4 text-xs font-semibold text-text-muted">담당 과목</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUBJECT_PILLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSubject(s)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedSubjects.includes(s)
                      ? "bg-primary text-white"
                      : "border border-gray-200 text-text-secondary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-xs font-semibold text-text-muted">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-xl border py-2 text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void createMatch()}
                className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white"
              >
                매칭 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
