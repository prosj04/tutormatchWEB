"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar";
import {
  formatDateKey,
  formatDoneTime,
  formatPlanHeader,
  parseDateKey,
} from "@/lib/study-plan-dates";

import type { StudyPlanItem } from "./teacher-students-types";

type TeacherStudentPlanTabProps = {
  studentId: string;
};

export function TeacherStudentPlanTab({ studentId }: TeacherStudentPlanTabProps) {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(
    formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate()),
  );
  const parsed = parseDateKey(selectedDate);
  const [calendarYear, setCalendarYear] = useState(parsed.year);
  const [calendarMonth, setCalendarMonth] = useState(parsed.month);
  const [planDates, setPlanDates] = useState<Set<string>>(new Set());
  const [plan, setPlan] = useState<StudyPlanItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentDraft, setCommentDraft] = useState("");
  const [editingComment, setEditingComment] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [commentToast, setCommentToast] = useState(false);

  const monthKey = useMemo(
    () => `${calendarYear}-${String(calendarMonth).padStart(2, "0")}`,
    [calendarYear, calendarMonth],
  );

  const fetchPlanSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/teacher/students/${studentId}/plans?month=${monthKey}&date=${selectedDate}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        dates: string[];
        plan: StudyPlanItem | null;
      };
      setPlanDates(new Set(data.dates));
      setPlan(data.plan);
      setCommentDraft(data.plan?.comment ?? "");
      setEditingComment(!data.plan?.comment);
    } finally {
      setLoading(false);
    }
  }, [studentId, monthKey, selectedDate]);

  useEffect(() => {
    void fetchPlanSnapshot();
  }, [fetchPlanSnapshot]);

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    const { year, month } = parseDateKey(date);
    setCalendarYear(year);
    setCalendarMonth(month);
  }

  async function handleSaveComment() {
    if (!plan) return;
    setSavingComment(true);
    try {
      const res = await fetch(`/api/teacher/plans/${plan.id}/comment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: commentDraft }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { plan: StudyPlanItem };
      setPlan(data.plan);
      setCommentDraft(data.plan.comment ?? "");
      setEditingComment(!data.plan.comment);
      setCommentToast(true);
      setTimeout(() => setCommentToast(false), 2500);
    } finally {
      setSavingComment(false);
    }
  }

  const tasks = plan?.tasks ?? [];
  const doneCount = tasks.filter((t) => t.isDone).length;
  const totalCount = tasks.length;
  const rate =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <DashboardCalendar
        year={calendarYear}
        month={calendarMonth}
        selectedDate={selectedDate}
        planDates={planDates}
        onSelectDate={handleSelectDate}
        onMonthChange={(year, month) => {
          setCalendarYear(year);
          setCalendarMonth(month);
        }}
      />

      {loading ? (
        <p className="text-center text-sm text-text-muted">불러오는 중…</p>
      ) : !plan ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-background p-8 text-center text-sm text-text-secondary">
          이 날짜에 등록된 학습 계획이 없습니다.
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-lg font-bold text-text-primary">
              {formatPlanHeader(selectedDate)}
            </h3>
            {totalCount > 0 && (
              <p className="mt-1 text-sm text-text-secondary">
                {doneCount}/{totalCount} 완료 ({rate}%)
              </p>
            )}
          </div>

          <ul className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4">
            {tasks.length === 0 ? (
              <li className="py-4 text-center text-sm text-text-muted">
                등록된 할 일이 없습니다.
              </li>
            ) : (
              tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-3 rounded-xl border border-gray-50 bg-background/50 px-3 py-2.5"
                >
                  <input
                    type="checkbox"
                    checked={task.isDone}
                    readOnly
                    disabled
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${
                        task.isDone
                          ? "text-text-muted line-through"
                          : "text-text-primary"
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.isDone && task.doneAt && (
                      <p className="mt-0.5 text-xs text-text-muted">
                        {formatDoneTime(task.doneAt)}
                      </p>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>

          <section className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-text-primary">선생님 코멘트</h4>
              {plan.comment && !editingComment && (
                <button
                  type="button"
                  onClick={() => setEditingComment(true)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  수정
                </button>
              )}
            </div>

            {plan.comment && !editingComment ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                {plan.comment}
              </p>
            ) : (
              <>
                <textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  rows={4}
                  placeholder="이 날의 학습 계획에 코멘트를 남겨주세요"
                  className="mt-3 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  disabled={savingComment || !commentDraft.trim()}
                  onClick={() => void handleSaveComment()}
                  className="mt-3 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingComment ? "저장 중…" : "코멘트 저장"}
                </button>
              </>
            )}
          </section>
        </>
      )}

      {commentToast && (
        <p
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-text-primary px-5 py-2.5 text-sm text-white shadow-lg"
        >
          코멘트가 저장되었습니다
        </p>
      )}
    </div>
  );
}
