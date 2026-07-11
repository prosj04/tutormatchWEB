"use client";

import type { StudentListItem } from "./teacher-students-types";

/**
 * 시안 pg-plan/pg-questions 상단의 학생 선택 .opts 세그먼트.
 * 담당 학생 목록을 concord .opt 버튼으로 렌더하고 선택 상태를 위로 전달한다.
 */
export function TeacherStudentPicker({
  students,
  selectedId,
  onSelect,
}: {
  students: StudentListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (students.length === 0) return null;
  return (
    <div className="field">
      <label>학생 선택</label>
      <div className="opts">
        {students.map((student) => (
          <button
            key={student.id}
            type="button"
            className="opt"
            aria-pressed={student.id === selectedId}
            onClick={() => onSelect(student.id)}
          >
            {student.name} · {student.grade}
          </button>
        ))}
      </div>
    </div>
  );
}
