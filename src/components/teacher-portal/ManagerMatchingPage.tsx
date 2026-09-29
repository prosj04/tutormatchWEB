"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ManagerMatchingStudent,
  ManagerMatchingTeacher,
} from "@/lib/manager-portal-data";
import { todayDateKey } from "@/lib/study-plan-dates";

type MatchStudent = ManagerMatchingStudent;
type MatchTeacher = ManagerMatchingTeacher;

function parseSubjects(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

type ManagerMatchingPageProps = {
  initialStudents: MatchStudent[];
  initialTeachers: MatchTeacher[];
  /** 상담 관리에서 "선생님 배정"으로 진입 시 프리셀렉트할 학생 id */
  initialSelectedId?: string | null;
};

export function ManagerMatchingPage({
  initialStudents,
  initialTeachers,
  initialSelectedId = null,
}: ManagerMatchingPageProps) {
  const [students, setStudents] = useState<MatchStudent[]>(initialStudents);
  const [teachers, setTeachers] = useState<MatchTeacher[]>(initialTeachers);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    (initialSelectedId && initialStudents.some((s) => s.id === initialSelectedId)
      ? initialSelectedId
      : initialStudents[0]?.id) ?? null,
  );
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [matchSubjects, setMatchSubjects] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchReason, setMatchReason] = useState<string>("");
  const [showAllTeachers, setShowAllTeachers] = useState(false);

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

  const selected = students.find((s) => s.id === selectedId);

  const studentSubjectList = useMemo(
    () => (selected ? parseSubjects(selected.subjects) : []),
    [selected],
  );

  const subjectMatchedTeachers = useMemo(() => {
    if (!selected || studentSubjectList.length === 0) return teachers;
    return teachers.filter((t) => {
      const ts = parseSubjects(t.subjects);
      return studentSubjectList.some((s) =>
        ts.some((tt) => tt.includes(s) || s.includes(tt)),
      );
    });
  }, [teachers, selected, studentSubjectList]);

  const filteredTeachers = showAllTeachers ? teachers : subjectMatchedTeachers;

  useEffect(() => {
    if (!selected) {
      setMatchSubjects([]);
      setMatchReason("");
      return;
    }
    setMatchSubjects(studentSubjectList);
    setTeacherId(null);
    setMatchReason("");
    setShowAllTeachers(false);
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
          reassign: Boolean(selected.currentTeacherName),
          subjects: matchSubjects.join(", "),
          startDate: todayDateKey(),
          matchReason: matchReason.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "매칭에 실패했습니다.");
        return;
      }
      await load();
      setTeacherId(null);
      setMatchReason("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page on" id="pg-matching">
      <div className="crumb">매칭</div>
      <h1>매칭</h1>
      <p className="sub">
        학생↔선생님 매칭을 생성합니다. 매칭 사유는 학생·학부모에게 전달됩니다.
      </p>

      <div className="sec sf-split-form">
        <div className="sf-block">
          <div className="sf-block-h">
            매칭 대기 학생
            {!loading && students.length > 0 ? (
              <span className="sf-note">{students.length}명 · 행을 눌러 선택</span>
            ) : null}
          </div>
          {loading ? (
            <p className="sf-sub">불러오는 중…</p>
          ) : students.length === 0 ? (
            <p className="sf-sub">매칭 대기 학생이 없습니다.</p>
          ) : (
            <div className="sf-rows">
              {students.map((s) => {
                const isSelected = selectedId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={isSelected ? "sf-r sf-top on" : "sf-r sf-top"}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <div className="sf-g">
                      <b>{[s.name, s.grade, s.subjects].filter(Boolean).join(" · ")}</b>
                      {s.currentTeacherName ? (
                        <p>현재 배정: {s.currentTeacherName} · 재배정 시 이력 유지</p>
                      ) : s.consultationNote ? (
                        <p>{s.consultationNote}</p>
                      ) : null}
                    </div>
                    <div className="sf-acts">
                      {s.currentTeacherName ? (
                        <span className="bst warn">재매칭</span>
                      ) : (
                        <span className="bst mut">미매칭</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="sf-block">
          {!selected ? (
            <>
              <div className="sf-block-h">선생님 배정</div>
              <p className="sf-sub">학생을 선택해주세요.</p>
            </>
          ) : (
            <>
              <div className="sf-block-h">{selected.name} → 선생님 선택</div>
              {filteredTeachers.length === 0 ? (
                <div>
                  <p className="sf-sub">
                    {showAllTeachers
                      ? "등록된 선생님이 없습니다."
                      : "학생 과목과 일치하는 선생님이 없습니다."}
                  </p>
                  {!showAllTeachers && teachers.length > 0 ? (
                    <div className="sf-actions">
                      <button
                        type="button"
                        className="btn sec sm"
                        onClick={() => setShowAllTeachers(true)}
                      >
                        과목 필터 해제 · 전체 선생님 보기 ({teachers.length}명)
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  {showAllTeachers ? (
                    <p className="sf-sub">
                      과목 필터 해제됨 — 전체 선생님 표시 중{" "}
                      <button
                        type="button"
                        className="sf-link-btn"
                        onClick={() => setShowAllTeachers(false)}
                      >
                        과목 맞춤만 보기
                      </button>
                    </p>
                  ) : null}
                  <div className="opts" style={{ marginTop: "12px" }}>
                    {filteredTeachers.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className="opt"
                        aria-pressed={teacherId === t.id}
                        onClick={() => setTeacherId(t.id)}
                      >
                        {t.name} · {t.subjects} · 담당 {t.activeStudentCount}명
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="field">
                <label>담당 과목</label>
                {studentSubjectList.length === 0 ? (
                  <p className="sf-sub">
                    학생의 과목 정보가 없습니다. 학생 정보에 과목을 입력한 뒤 매칭할 수 있어요.
                  </p>
                ) : (
                  <div className="opts">
                    {studentSubjectList.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="opt"
                        aria-pressed={matchSubjects.includes(s)}
                        onClick={() => toggleSubject(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="field">
                <label>
                  매칭 사유{" "}
                  <span className="mut-2" style={{ fontWeight: 400 }}>
                    · 학생·학부모에게 그대로 전달돼요
                  </span>{" "}
                  <span className="bst acc">학생 공개</span>
                </label>
                <textarea
                  className="inp area filled"
                  value={matchReason}
                  onChange={(e) => setMatchReason(e.target.value)}
                  placeholder="이 선생님을 배정한 이유를 간단히 설명해 주세요. (선택사항, 최대 500자)"
                  rows={3}
                />
              </div>

              {error ? (
                <div className="banner warn" style={{ marginTop: "16px" }} role="alert">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="sf-actions">
                <button
                  type="button"
                  className="btn pri btn-block"
                  disabled={!teacherId || matchSubjects.length === 0 || submitting}
                  title={
                    !teacherId
                      ? "선생님을 먼저 선택하세요"
                      : matchSubjects.length === 0
                        ? "담당 과목을 1개 이상 선택해야 보낼 수 있습니다"
                        : undefined
                  }
                  onClick={() => void handleMatch()}
                >
                  {submitting ? "등록 중…" : "매칭 제안 보내기"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
