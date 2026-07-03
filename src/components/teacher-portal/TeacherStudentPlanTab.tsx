"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar";
import {
  formatDateKey,
  formatDoneTime,
  formatPlanHeader,
  parseDateKey,
} from "@/lib/study-plan-dates";

import type { HomeworkTemplate, StudyPlanItem } from "./teacher-students-types";

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
  const [homeworkTasks, setHomeworkTasks] = useState("");
  const [homeworkDays, setHomeworkDays] = useState<4 | 7>(7);
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [savingHomework, setSavingHomework] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [homeworkMessage, setHomeworkMessage] = useState<string | null>(null);
  const [homeworkTemplates, setHomeworkTemplates] = useState<HomeworkTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

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

  const fetchHomeworkTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/homework-templates");
      if (!res.ok) return;
      const data = (await res.json()) as { templates: HomeworkTemplate[] };
      setHomeworkTemplates(data.templates);
    } catch {
      // ignore template load failures
    }
  }, []);

  useEffect(() => {
    setSelectedTemplateId("");
    void fetchHomeworkTemplates();
  }, [fetchHomeworkTemplates]);

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

  async function handleDistributeHomework() {
    if (!homeworkTasks.trim()) return;
    setSavingHomework(true);
    setHomeworkMessage(null);
    try {
      const res = await fetch(`/api/teacher/students/${studentId}/homework-distribution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: selectedDate,
          days: homeworkDays,
          tasks: homeworkTasks,
          repeatWeeks,
        }),
      });
      if (!res.ok) {
        setHomeworkMessage("숙제 자동 분배에 실패했습니다.");
        return;
      }
      const data = (await res.json()) as { dates: string[] };
      setHomeworkTasks("");
      setHomeworkMessage(
        `${data.dates.length}일치 숙제가 생성되었습니다. 달력에서 확인해 주세요.`,
      );
      await fetchPlanSnapshot();
    } finally {
      setSavingHomework(false);
    }
  }

  function addDays(date: string, offset: number) {
    const [year, month, day] = date.split("-").map(Number);
    const d = new Date(year, month - 1, day + offset, 12, 0, 0, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  }

  async function handleLoadLastWeekHomework() {
    setLoadingTemplate(true);
    setHomeworkMessage(null);
    try {
      const templateStart = addDays(selectedDate, -7);
      const res = await fetch(
        `/api/teacher/students/${studentId}/plans?templateStart=${templateStart}&templateDays=${homeworkDays}`,
      );
      if (!res.ok) {
        setHomeworkMessage("지난 주 숙제를 불러오지 못했습니다.");
        return;
      }
      const data = (await res.json()) as {
        template: { tasks: string[]; startDate: string; days: 4 | 7 };
      };
      if (data.template.tasks.length === 0) {
        setHomeworkMessage("지난 주에 재사용할 숙제가 없습니다.");
        return;
      }
      setHomeworkTasks(data.template.tasks.join("\n"));
      setHomeworkMessage(
        `지난 주 ${data.template.days}일치 숙제 ${data.template.tasks.length}개를 불러왔습니다.`,
      );
    } finally {
      setLoadingTemplate(false);
    }
  }

  function handleSelectTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const template = homeworkTemplates.find((t) => t.id === templateId);
    if (!template) return;
    setHomeworkTasks(template.tasks);
    setHomeworkDays(template.defaultDays);
  }

  async function handleSaveTemplate() {
    if (!templateName.trim() || !homeworkTasks.trim()) return;
    setSavingTemplate(true);
    setHomeworkMessage(null);
    try {
      const res = await fetch("/api/teacher/homework-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: templateName,
          defaultDays: homeworkDays,
          tasks: homeworkTasks,
        }),
      });
      if (!res.ok) {
        setHomeworkMessage("템플릿 저장에 실패했습니다.");
        return;
      }
      setTemplateName("");
      setHomeworkMessage("템플릿이 저장되었습니다.");
      await fetchHomeworkTemplates();
    } finally {
      setSavingTemplate(false);
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

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              주간 숙제 자동 분배
            </h3>
            <p className="mt-1 text-xs text-text-secondary">
              선택한 날짜부터 4일 또는 7일치 숙제를 일별로 나눠 생성합니다. 지난 주 숙제를 불러와 같은 맥락으로 반복할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loadingTemplate || savingHomework}
              onClick={() => void handleLoadLastWeekHomework()}
              className="rounded-lg border border-primary/30 bg-white px-3 py-2 text-xs font-semibold text-primary disabled:opacity-50"
            >
              {loadingTemplate ? "불러오는 중…" : "지난 주 숙제 불러오기"}
            </button>
            <select
              value={homeworkDays}
              onChange={(e) => setHomeworkDays(Number(e.target.value) as 4 | 7)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
            >
              <option value={7}>7일치</option>
              <option value={4}>4일치</option>
            </select>
            <select
              value={repeatWeeks}
              onChange={(e) => setRepeatWeeks(Number(e.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
            >
              {[1, 2, 3, 4].map((week) => (
                <option key={week} value={week}>
                  {week}주 반복
                </option>
              ))}
            </select>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
            >
              <option value="">템플릿 선택</option>
              {homeworkTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <textarea
          value={homeworkTasks}
          onChange={(e) => setHomeworkTasks(e.target.value)}
          rows={5}
          placeholder="숙제를 줄바꿈으로 입력하세요. 예)\n수학 개념 복습 20분\n오답노트 5문제\n영어 단어 30개"
          className="mt-4 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-muted">
            시작일: {formatPlanHeader(selectedDate).replace(" 학습 계획", "")}
          </p>
          <button
            type="button"
            disabled={savingHomework || !homeworkTasks.trim()}
            onClick={() => void handleDistributeHomework()}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingHomework ? "분배 중…" : "숙제 자동 분배"}
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="템플릿 이름"
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={savingTemplate || !templateName.trim() || !homeworkTasks.trim()}
            onClick={() => void handleSaveTemplate()}
            className="rounded-lg border border-primary/30 bg-white px-3 py-2 text-xs font-semibold text-primary disabled:opacity-50"
          >
            {savingTemplate ? "저장 중…" : "템플릿 저장"}
          </button>
        </div>
        {homeworkMessage ? (
          <p className="mt-2 text-xs font-medium text-primary" role="status">
            {homeworkMessage}
          </p>
        ) : null}
      </section>

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
                      {task.source?.startsWith("teacher") ? (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          선생님 숙제
                        </span>
                      ) : null}
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
