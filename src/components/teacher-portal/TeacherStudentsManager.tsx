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
    fetchStudents();
  }, [fetchStudents]);

  const selected = students.find((s) => s.id === selectedId);

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
