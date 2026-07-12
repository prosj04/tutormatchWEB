"use client";

import { useCallback, useEffect, useState } from "react";

import type { StudentListItem } from "./teacher-students-types";

type UpcomingLesson = {
  id: string;
  startAt: string;
  subject: string;
  durationMin: number;
};

function formatSubjects(subjects: string) {
  return subjects
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" · ");
}

function formatNextLesson(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function initial(name: string) {
  return name.slice(0, 1);
}

type TeacherStudentsManagerProps = {
  initialStudents?: StudentListItem[];
};

export function TeacherStudentsManager({
  initialStudents = [],
}: TeacherStudentsManagerProps) {
  const [students, setStudents] = useState<StudentListItem[]>(initialStudents);
  const [loading, setLoading] = useState(initialStudents.length === 0);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialStudents[0]?.id ?? null,
  );
  const [lessonDate, setLessonDate] = useState("");
  const [lessonTime, setLessonTime] = useState("19:00");
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonMessage, setLessonMessage] = useState<string | null>(null);

  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<UpcomingLesson | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelMakeupAt, setCancelMakeupAt] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/students");
      if (!res.ok) return;
      const data = (await res.json()) as { students: StudentListItem[] };
      setStudents(data.students);
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
    if (initialStudents.length > 0) return;
    void fetchStudents();
  }, [fetchStudents, initialStudents.length]);

  const fetchUpcomingLessons = useCallback(async (studentId: string) => {
    setUpcomingLoading(true);
    setUpcomingLessons([]);
    setCancelMessage(null);
    try {
      const res = await fetch(
        `/api/teacher/lessons?studentId=${studentId}&status=SCHEDULED&upcoming=1`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { lessons: UpcomingLesson[] };
      setUpcomingLessons(data.lessons);
    } finally {
      setUpcomingLoading(false);
    }
  }, []);

  const handleCancelLesson = useCallback(
    async (lessonId: string, reason: string, makeupLocal: string) => {
    setCancelling(true);
    setCancelMessage(null);
    try {
      const trimmed = reason.trim();
      // datetime-local(로컬 시각) → ISO. 유효/미래 판정은 서버가 재검증.
      let makeupAtIso: string | null = null;
      if (makeupLocal) {
        const parsed = new Date(makeupLocal);
        if (!Number.isNaN(parsed.getTime())) makeupAtIso = parsed.toISOString();
      }
      const res = await fetch(`/api/teacher/lessons/${lessonId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(trimmed ? { reason: trimmed } : {}),
          ...(makeupAtIso ? { makeupAt: makeupAtIso } : {}),
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setCancelMessage(data.error ?? "취소에 실패했습니다.");
        return;
      }
      const data = (await res.json()) as {
        makeupCreated?: boolean;
        makeupSkippedReason?: string | null;
      };
      setCancelMessage(
        data.makeupCreated
          ? makeupAtIso
            ? "수업이 취소되었습니다. 제안하신 시간에 보강 수업이 생성되었습니다."
            : "수업이 취소되었습니다. 보강 수업이 7일 뒤 자동 생성되었습니다."
          : `수업이 취소되었습니다. ${
              data.makeupSkippedReason ?? "보충 수업은 자동 생성되지 않았습니다."
            }`,
      );
      setUpcomingLessons((prev) => prev.filter((l) => l.id !== lessonId));
    } finally {
      setCancelling(false);
      setCancelTarget(null);
      setCancelReason("");
      setCancelMakeupAt("");
    }
  },
  [],
  );

  const selected = students.find((s) => s.id === selectedId);

  useEffect(() => {
    if (!selected) return;
    if (selected.firstLessonAt) {
      const d = new Date(selected.firstLessonAt);
      setLessonDate(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate(),
        ).padStart(2, "0")}`,
      );
      setLessonTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      );
    } else {
      setLessonDate(selected.startDate);
      setLessonTime("19:00");
    }
    setLessonMessage(null);
    void fetchUpcomingLessons(selected.id);
  }, [selected, fetchUpcomingLessons]);

  async function saveFirstLesson() {
    if (!selected || !lessonDate || !lessonTime) return;
    setSavingLesson(true);
    setLessonMessage(null);
    try {
      const res = await fetch(`/api/teacher/students/${selected.id}/first-lesson`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: lessonDate, time: lessonTime }),
      });
      if (!res.ok) {
        setLessonMessage("첫 수업 일정 저장에 실패했습니다.");
        return;
      }
      const data = (await res.json()) as {
        lesson: { startAt: string };
        startDate: string;
      };
      setStudents((prev) =>
        prev.map((student) =>
          student.id === selected.id
            ? { ...student, startDate: data.startDate, firstLessonAt: data.lesson.startAt }
            : student,
        ),
      );
      setLessonMessage("첫 수업 일정이 저장되었습니다. 숙제는 학생 탭에서 분배할 수 있어요.");
      void fetchUpcomingLessons(selected.id);
    } finally {
      setSavingLesson(false);
    }
  }

  return (
    <section className="page on" id="pg-students">
      <div className="crumb">/teacher-portal/dashboard/students</div>
      <h1>담당 학생</h1>
      <p className="sub">매칭된 학생만 표시됩니다. 행을 누르면 상세(첫 수업일·예정 수업)로 이동합니다.</p>

      <div className="sec card">
        {loading ? (
          <div className="row">
            <div className="g">
              <p>불러오는 중…</p>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="row">
            <div className="g">
              <p>배정된 학생이 없습니다.</p>
            </div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>학생</th>
                <th>과목·횟수</th>
                <th>다음 수업</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const hasFirst = Boolean(student.firstLessonAt);
                return (
                  <tr key={student.id}>
                    <td>
                      <b>
                        {student.name} · {student.grade}
                      </b>
                    </td>
                    <td>{formatSubjects(student.subjects) || "—"}</td>
                    <td className="num">{formatNextLesson(student.firstLessonAt)}</td>
                    <td>
                      {hasFirst ? (
                        <span className="bst acc">수업 중</span>
                      ) : (
                        <span className="bst warn">첫 수업일 미정</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={hasFirst ? "btn sec sm" : "btn pri sm"}
                        onClick={() => setSelectedId(student.id)}
                      >
                        {hasFirst ? "상세" : "첫 수업일 설정"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected ? (
        <div className="sec grid2">
          <div className="card" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>
              {selected.name} · 첫 수업일 설정
            </h2>
            <div className="field">
              <label>날짜</label>
              <input
                type="date"
                className="inp filled"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label>시간</label>
              <input
                type="time"
                className="inp filled"
                value={lessonTime}
                onChange={(e) => setLessonTime(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn pri"
              style={{ marginTop: "2px" }}
              disabled={savingLesson || !lessonDate || !lessonTime}
              onClick={() => void saveFirstLesson()}
            >
              {savingLesson ? "저장 중…" : "첫 수업일 확정"}
            </button>
            {lessonMessage ? (
              <p
                role="status"
                style={{ marginTop: "12px", fontSize: "12.5px", color: "var(--acc-text)" }}
              >
                {lessonMessage}
              </p>
            ) : null}
          </div>

          <div className="card">
            {upcomingLoading ? (
              <div className="row">
                <div className="g">
                  <p>불러오는 중…</p>
                </div>
              </div>
            ) : upcomingLessons.length === 0 ? (
              <div className="row">
                <div className="g">
                  <p>예정된 수업이 없습니다.</p>
                </div>
              </div>
            ) : (
              upcomingLessons.map((lesson) => {
                const d = new Date(lesson.startAt);
                return (
                  <div className="row" key={lesson.id}>
                    <span className="av" style={{ borderRadius: "10px" }}>
                      {initial(selected.name)}
                    </span>
                    <div className="g">
                      <b>
                        {selected.name} · {lesson.subject}
                      </b>
                      <p>
                        {d.getMonth() + 1}월 {d.getDate()}일 (
                        {["일", "월", "화", "수", "목", "금", "토"][d.getDay()]}){" "}
                        {String(d.getHours()).padStart(2, "0")}:
                        {String(d.getMinutes()).padStart(2, "0")} · {lesson.durationMin}분
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => {
                        setCancelTarget(lesson);
                        setCancelReason("");
                      }}
                    >
                      취소
                    </button>
                  </div>
                );
              })
            )}
            {cancelMessage ? (
              <div
                className="banner warn"
                style={{ margin: "12px 20px 16px" }}
                role="status"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                <span>{cancelMessage}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {cancelTarget ? (
        <div
          className="scrim on"
          onClick={(e) => {
            if (e.target === e.currentTarget && !cancelling) setCancelTarget(null);
          }}
          role="presentation"
        >
          <div className="modal" role="dialog" aria-modal="true" aria-label="수업 취소">
            <div className="m-b">
              <h3>수업을 취소하시겠어요?</h3>
              <p className="m-p">
                {selected?.name} ·{" "}
                {(() => {
                  const d = new Date(cancelTarget.startAt);
                  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${["일", "월", "화", "수", "목", "금", "토"][d.getDay()]}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} · ${cancelTarget.durationMin}분`;
                })()}
                . 취소 시 학생·학부모에게 알림이 발송되며, 보강 수업이 자동 생성됩니다.
              </p>
              <div className="field" style={{ marginTop: "14px" }}>
                <label>취소 사유</label>
                <input
                  className="inp"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="예: 개인 사정"
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>보강 제안 시간 (선택)</label>
                <input
                  className="inp"
                  type="datetime-local"
                  value={cancelMakeupAt}
                  onChange={(e) => setCancelMakeupAt(e.target.value)}
                />
              </div>
            </div>
            <div className="m-f">
              <button
                type="button"
                className="btn sec"
                disabled={cancelling}
                onClick={() => setCancelTarget(null)}
              >
                돌아가기
              </button>
              <button
                type="button"
                className="btn danger solid"
                disabled={cancelling}
                onClick={() =>
                  void handleCancelLesson(
                    cancelTarget.id,
                    cancelReason,
                    cancelMakeupAt,
                  )
                }
              >
                {cancelling ? "취소 중…" : "취소 + 보강 제안"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
