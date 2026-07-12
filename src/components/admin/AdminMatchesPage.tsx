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
  const [unmatchId, setUnmatchId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadTeachers = useCallback(async () => {
    const res = await fetch("/api/admin/teachers?status=approved&limit=100");
    if (!res.ok) throw new Error("failed");
    const data = (await res.json()) as { teachers: TeacherItem[] };
    const list = data.teachers;
    setTeachers(list);
    if (list.length > 0) {
      setSelectedTeacherId((prev) => prev ?? list[0].id);
    }
  }, []);

  const loadMatches = useCallback(async () => {
    const res = await fetch("/api/admin/matches");
    if (!res.ok) throw new Error("failed");
    const data = (await res.json()) as { matches: MatchRow[] };
    setMatches(data.matches);
  }, []);

  const loadAll = useCallback(async () => {
    setLoadError(false);
    try {
      await Promise.all([loadTeachers(), loadMatches()]);
    } catch {
      setLoadError(true);
    }
  }, [loadTeachers, loadMatches]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
    if (!selectedTeacherId || !studentId || selectedSubjects.length === 0) {
      alert("학생과 담당 과목을 선택해 주세요.");
      return;
    }
    setCreating(true);
    try {
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
        await loadMatches();
        alert("매칭이 등록되었습니다.");
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        alert(err.error ?? "매칭 등록에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch {
      alert("매칭 등록에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setCreating(false);
    }
  }

  async function deactivateMatch(id: string) {
    await fetch(`/api/admin/matches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    setUnmatchId(null);
    loadMatches();
  }

  return (
    <section className="page on" data-screen-label="매칭 관리">
      <div className="crumb">/admin/matches</div>
      <h1>매칭 관리</h1>
      <p className="sub">진행 중인 매칭 현황입니다.</p>

      <div className="sec filters">
        <div className="opts">
          {teachers.map((t) => {
            const count = matches.filter((m) => m.teacherId === t.id && m.isActive).length;
            return (
              <button
                key={t.id}
                type="button"
                className="opt"
                aria-pressed={selectedTeacherId === t.id}
                onClick={() => setSelectedTeacherId(t.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getEffectivePhotoUrl(t.photoUrl, t.gender)}
                  alt={`${t.name} 프로필`}
                  style={{ width: "18px", height: "18px", borderRadius: "50%", objectFit: "cover", marginRight: "6px", verticalAlign: "middle" }}
                />
                {t.name} · {count}명
              </button>
            );
          })}
        </div>
        {selectedTeacher ? (
          <button type="button" className="btn sec sm" style={{ marginLeft: "auto" }} onClick={() => openAddModal()}>
            학생 추가
          </button>
        ) : null}
      </div>

      {loadError && (
        <div className="sec card" style={{ marginTop: 0, borderColor: "var(--danger, #d33)" }}>
          <div className="row">
            <div className="g">
              <b>불러오지 못했습니다</b>
              <p>매칭 현황을 불러오는 중 문제가 발생했습니다.</p>
            </div>
            <button type="button" className="btn sec sm" onClick={() => loadAll()}>다시 시도</button>
          </div>
        </div>
      )}

      <div className="sec card" style={{ overflowX: "auto", marginTop: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>학생</th>
              <th>선생님</th>
              <th>과목</th>
              <th>시작일</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!selectedTeacher ? (
              <tr><td colSpan={6}>선생님을 선택해 주세요.</td></tr>
            ) : teacherMatches.length === 0 ? (
              <tr><td colSpan={6}>활성 매칭이 없습니다.</td></tr>
            ) : (
              teacherMatches.map((m) => (
                <tr key={m.id}>
                  <td><b>{m.student.name} · {m.student.grade}</b></td>
                  <td>{m.teacher.name}</td>
                  <td>{m.subjects}</td>
                  <td>{m.startDate}</td>
                  <td><span className="bst acc">수업중</span></td>
                  <td>
                    <button type="button" className="btn ghost sm" onClick={() => setUnmatchId(m.id)}>해제</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={`scrim${modalOpen ? " on" : ""}`}>
        <div className="modal" role="dialog" aria-modal="true" aria-label="학생 매칭 등록">
          <div className="m-b">
            <h3>학생 매칭 등록</h3>
            <p className="m-p">{selectedTeacher?.name ?? "선생님"} 에게 학생을 배정합니다.</p>
            <div className="field" style={{ marginTop: "14px" }}>
              <label>학생</label>
              <select className="inp filled" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                {studentOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>담당 과목</label>
              <div className="opts">
                {SUBJECT_PILLS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="opt"
                    aria-pressed={selectedSubjects.includes(s)}
                    onClick={() => toggleSubject(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>시작일</label>
              <input type="date" className="inp filled" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <div className="m-f">
            <button type="button" className="btn sec" onClick={() => setModalOpen(false)} disabled={creating}>취소</button>
            <button type="button" className="btn pri" onClick={() => void createMatch()} disabled={creating}>
              {creating ? "등록 중…" : "매칭 등록"}
            </button>
          </div>
        </div>
      </div>

      <div className={`scrim${unmatchId ? " on" : ""}`}>
        <div className="modal" role="dialog" aria-modal="true" aria-label="매칭 해제 확인">
          <div className="m-b">
            <h3>매칭을 해제하시겠어요?</h3>
            <p className="m-p">진행 중인 수업 일정이 모두 취소되고 학생·선생님에게 알림이 발송됩니다.</p>
          </div>
          <div className="m-f">
            <button type="button" className="btn sec" onClick={() => setUnmatchId(null)}>취소</button>
            <button
              type="button"
              className="btn danger solid"
              onClick={() => {
                if (unmatchId) void deactivateMatch(unmatchId);
              }}
            >
              해제
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
