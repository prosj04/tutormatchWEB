"use client";

import { useCallback, useEffect, useState } from "react";

import { TeacherStudentPlanTab } from "./TeacherStudentPlanTab";
import { TeacherStudentQuestionsTab } from "./TeacherStudentQuestionsTab";
import type { StudentListItem } from "./teacher-students-types";

type DetailTab = "plan" | "questions";

function formatStartDate(date: string) {
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return date;
  return `${y}.${m}.${d}`;
}

function formatFirstLesson(iso: string | null) {
  if (!iso) return "아직 설정되지 않음";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function formatSubjects(subjects: string) {
  return subjects
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" · ");
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
  const [detailTab, setDetailTab] = useState<DetailTab>("plan");
  const [lessonDate, setLessonDate] = useState("");
  const [lessonTime, setLessonTime] = useState("19:00");
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonMessage, setLessonMessage] = useState<string | null>(null);

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
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
          2,
          "0",
        )}`,
      );
    } else {
      setLessonDate(selected.startDate);
      setLessonTime("19:00");
    }
    setLessonMessage(null);
  }, [selected]);

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
            ? {
                ...student,
                startDate: data.startDate,
                firstLessonAt: data.lesson.startAt,
              }
            : student,
        ),
      );
      setLessonMessage("첫 수업 일정이 저장되었습니다.");
    } finally {
      setSavingLesson(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-text-primary sm:text-3xl">학생 관리</h1>
      <p className="mt-2 text-sm text-text-secondary">
        학생의 학습 계획을 확인하고 코멘트·질문 답변을 남길 수 있습니다.
      </p>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-72">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            학생 목록
          </h2>
          {loading ? (
            <p className="text-sm text-text-muted">불러오는 중…</p>
          ) : students.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-text-secondary">
              배정된 학생이 없습니다.
            </p>
          ) : (
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
              {students.map((student) => {
                const active = student.id === selectedId;
                const subjects = formatSubjects(student.subjects);
                return (
                  <li key={student.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(student.id);
                        setDetailTab("plan");
                      }}
                      className={`w-48 rounded-xl border px-4 py-3 text-left transition lg:w-full ${
                        active
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <p
                        className={`font-semibold ${active ? "text-primary" : "text-text-primary"}`}
                      >
                        {student.name}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">{student.grade}</p>
                      {subjects ? (
                        <p className="mt-1 truncate text-xs text-text-muted">{subjects}</p>
                      ) : null}
                      <p className="mt-1 text-[10px] text-text-muted">
                        수업 시작 {formatStartDate(student.startDate)}
                      </p>
                      {student.firstLessonAt ? (
                        <p className="mt-0.5 text-[10px] text-primary">
                          첫 수업 {formatFirstLesson(student.firstLessonAt)}
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
          {!selected ? (
            <p className="py-16 text-center text-sm text-text-secondary">
              학생을 선택해 주세요.
            </p>
          ) : (
            <>
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-text-primary">{selected.name}</h2>
                <p className="text-sm text-text-secondary">
                  {selected.grade}
                  {formatSubjects(selected.subjects)
                    ? ` · ${formatSubjects(selected.subjects)}`
                    : ""}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  수업 시작일 {formatStartDate(selected.startDate)}
                </p>
              </div>

              <section className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      첫 수업 일정
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary">
                      현재: {formatFirstLesson(selected.firstLessonAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="text-xs font-medium text-text-secondary">
                      날짜
                      <input
                        type="date"
                        value={lessonDate}
                        onChange={(e) => setLessonDate(e.target.value)}
                        className="mt-1 block rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                      />
                    </label>
                    <label className="text-xs font-medium text-text-secondary">
                      시간
                      <input
                        type="time"
                        value={lessonTime}
                        onChange={(e) => setLessonTime(e.target.value)}
                        className="mt-1 block rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={savingLesson || !lessonDate || !lessonTime}
                      onClick={() => void saveFirstLesson()}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {savingLesson ? "저장 중…" : "일정 저장"}
                    </button>
                  </div>
                </div>
                {lessonMessage ? (
                  <p className="mt-2 text-xs font-medium text-primary" role="status">
                    {lessonMessage}
                  </p>
                ) : null}
              </section>

              <div className="mt-4 flex gap-4 border-b border-gray-100">
                {(
                  [
                    { key: "plan" as const, label: "학습 계획" },
                    { key: "questions" as const, label: "질문" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDetailTab(tab.key)}
                    className={`border-b-2 pb-3 text-sm font-semibold transition ${
                      detailTab === tab.key
                        ? "border-primary text-text-primary"
                        : "border-transparent text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                {detailTab === "plan" ? (
                  <TeacherStudentPlanTab key={selected.id} studentId={selected.id} />
                ) : (
                  <TeacherStudentQuestionsTab key={selected.id} studentId={selected.id} />
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
